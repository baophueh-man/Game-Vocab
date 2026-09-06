import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Word, WordSet } from '../types';
import { generateId } from '../lib/utils';
import { audioDataToWavBytes } from './audio';
import { resizeBase64Image } from './image';
import { getImageFile, saveImageFile, getAudioFile, saveAudioFile } from '../lib/storage';

export interface PackageManifest {
  version: string;
  type: string;
  title: string;
  description: string;
  createdAt: string;
  words: {
    id: string;
    term: string;
    definition: string;
    imageFileName?: string | null;
    audioFileName?: string | null;
    audioViFileName?: string | null;
  }[];
}

/**
 * Export entire vocabulary set (terms, definitions, images, English audio .wav, Vietnamese audio .wav)
 * into a single unified .zip package with 1 click.
 */
export async function exportWordSetPackage(
  title: string,
  description: string,
  words: Word[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<Blob> {
  const zip = new JSZip();
  const imagesFolder = zip.folder('images');
  const audioEnFolder = zip.folder('audio_en');
  const audioViFolder = zip.folder('audio_vi');

  const totalSteps = words.length;
  const manifestWords: PackageManifest['words'] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const safeBaseName = `${i + 1}_${(word.term || 'word').replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    
    if (onProgress) {
      onProgress(i + 1, totalSteps, `Đang đóng gói từ ${i + 1}/${totalSteps}: "${word.term || 'Từ vựng'}"...`);
    }

    let imageFileName: string | null = null;
    let audioFileName: string | null = null;
    let audioViFileName: string | null = null;

    // 1. Process Image
    if (word.imageUrl) {
      try {
        let rawBase64 = '';
        let ext = 'png';

        if (word.imageUrl.startsWith('data:image')) {
          const match = word.imageUrl.match(/^data:image\/(\w+);base64,/);
          ext = match ? match[1] : 'png';
          rawBase64 = word.imageUrl.replace(/^data:image\/\w+;base64,/, '');
        } else if (word.imageUrl.startsWith('firestore://')) {
          const id = word.imageUrl.split('/').pop();
          if (id) {
            const data = await getImageFile(id);
            if (data) {
              const match = data.match(/^data:image\/(\w+);base64,/);
              ext = match ? match[1] : 'png';
              rawBase64 = data.replace(/^data:image\/\w+;base64,/, '');
            }
          }
        } else {
          // Web URL - fetch via proxy or direct
          try {
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(word.imageUrl)}`;
            let resp = await fetch(proxyUrl);
            if (!resp.ok) resp = await fetch(word.imageUrl);
            if (resp.ok) {
              const blob = await resp.blob();
              if (blob.type === 'image/jpeg') ext = 'jpg';
              else if (blob.type === 'image/svg+xml') ext = 'svg';
              else if (blob.type === 'image/webp') ext = 'webp';
              
              const arrayBuffer = await blob.arrayBuffer();
              const base64 = btoa(
                new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
              );
              rawBase64 = base64;
            }
          } catch (e) {
            console.warn('Could not fetch web image for package export:', e);
          }
        }

        if (rawBase64) {
          imageFileName = `${safeBaseName}.${ext}`;
          imagesFolder?.file(imageFileName, rawBase64, { base64: true });
        }
      } catch (err) {
        console.error('Failed to export image for word:', word.term, err);
      }
    }

    // 2. Process English Audio (Standardized to .wav)
    if (word.audioUrl) {
      try {
        let rawAudioSource = word.audioUrl;
        if (word.audioUrl.startsWith('firestore://')) {
          const id = word.audioUrl.split('/').pop();
          if (id) {
            const data = await getAudioFile(id);
            if (data) rawAudioSource = data;
          }
        }

        const wavBytes = await audioDataToWavBytes(rawAudioSource);
        audioFileName = `${safeBaseName}_en.wav`;
        audioEnFolder?.file(audioFileName, wavBytes);
      } catch (err) {
        console.error('Failed to export English audio for word:', word.term, err);
      }
    }

    // 3. Process Vietnamese Audio (Standardized to .wav)
    if (word.viAudioUrl) {
      try {
        let rawAudioSource = word.viAudioUrl;
        if (word.viAudioUrl.startsWith('firestore://')) {
          const id = word.viAudioUrl.split('/').pop();
          if (id) {
            const data = await getAudioFile(id);
            if (data) rawAudioSource = data;
          }
        }

        const wavBytes = await audioDataToWavBytes(rawAudioSource);
        audioViFileName = `${safeBaseName}_vi.wav`;
        audioViFolder?.file(audioViFileName, wavBytes);
      } catch (err) {
        console.error('Failed to export Vietnamese audio for word:', word.term, err);
      }
    }

    manifestWords.push({
      id: word.id,
      term: word.term,
      definition: word.definition,
      imageFileName,
      audioFileName,
      audioViFileName,
    });
  }

  const manifest: PackageManifest = {
    version: '1.0',
    type: 'vocagame_full_package',
    title: title || 'Bộ từ vựng',
    description: description || '',
    createdAt: new Date().toISOString(),
    words: manifestWords,
  };

  zip.file('package.json', JSON.stringify(manifest, null, 2));
  zip.file('data.json', JSON.stringify(manifest, null, 2));

  if (onProgress) {
    onProgress(totalSteps, totalSteps, 'Đang nén toàn bộ tệp thành gói ZIP...');
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const cleanTitle = (title || 'flashcard_package').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  saveAs(zipBlob, `${cleanTitle}_full_package.zip`);
  return zipBlob;
}

/**
 * Import a full .zip package with 1 click.
 * Automatically unpacks terms, definitions, images, and audio, and saves them safely with new independent IDs.
 */
export async function importWordSetPackage(
  file: File,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{ title: string; description: string; words: Word[] }> {
  const zip = await JSZip.loadAsync(file);

  // Find manifest or json file in zip
  let manifestContent: string | null = null;
  const manifestFile = zip.file('package.json') || zip.file('data.json') || zip.file('set.json');

  if (manifestFile) {
    manifestContent = await manifestFile.async('string');
  } else {
    // Look for any .json file at root
    const jsonFiles = Object.keys(zip.files).filter((k) => k.endsWith('.json') && !k.includes('/'));
    if (jsonFiles.length > 0) {
      manifestContent = await zip.file(jsonFiles[0])!.async('string');
    }
  }

  if (!manifestContent) {
    throw new Error('Không tìm thấy file thông tin cấu trúc (package.json) trong gói ZIP.');
  }

  const parsedData = JSON.parse(manifestContent);
  const importedWordsRaw = Array.isArray(parsedData.words) ? parsedData.words : [];
  const title = parsedData.title ? `${parsedData.title} (Bản sao)` : (file.name.replace(/\.[^/.]+$/, '') || 'Bộ từ vựng mới');
  const description = parsedData.description || '';

  const totalSteps = importedWordsRaw.length;
  const processedWords: Word[] = [];

  for (let i = 0; i < importedWordsRaw.length; i++) {
    const rawWord = importedWordsRaw[i];
    if (onProgress) {
      onProgress(i + 1, totalSteps, `Đang giải nén từ ${i + 1}/${totalSteps}: "${rawWord.term || ''}"...`);
    }

    let imageUrl: string | undefined = undefined;
    let audioUrl: string | undefined = undefined;
    let viAudioUrl: string | undefined = undefined;

    // 1. Unpack Image
    if (rawWord.imageFileName) {
      const imgPathOptions = [
        rawWord.imageFileName,
        `images/${rawWord.imageFileName}`,
        rawWord.imageFileName.replace(/^images\//, ''),
      ];

      for (const p of imgPathOptions) {
        const fileInZip = zip.file(p);
        if (fileInZip) {
          try {
            const ext = p.split('.').pop()?.toLowerCase() || 'png';
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : ext === 'svg' ? 'image/svg+xml' : 'image/png';
            const base64Data = await fileInZip.async('base64');
            const dataUrl = `data:${mime};base64,${base64Data}`;
            
            // Resize and save to storage
            const resized = await resizeBase64Image(dataUrl, 400, 400);
            imageUrl = await saveImageFile(resized);
            break;
          } catch (e) {
            console.error('Error importing image from zip:', p, e);
          }
        }
      }
    }

    // 2. Unpack English Audio
    if (rawWord.audioFileName) {
      const audioPathOptions = [
        rawWord.audioFileName,
        `audio_en/${rawWord.audioFileName}`,
        `audio/${rawWord.audioFileName}`,
        rawWord.audioFileName.replace(/^audio_en\//, ''),
      ];

      for (const p of audioPathOptions) {
        const fileInZip = zip.file(p);
        if (fileInZip) {
          try {
            const base64Data = await fileInZip.async('base64');
            const dataUrl = `data:audio/wav;base64,${base64Data}`;
            audioUrl = await saveAudioFile(dataUrl);
            break;
          } catch (e) {
            console.error('Error importing audio from zip:', p, e);
          }
        }
      }
    }

    // 3. Unpack Vietnamese Audio
    if (rawWord.audioViFileName) {
      const viAudioPathOptions = [
        rawWord.audioViFileName,
        `audio_vi/${rawWord.audioViFileName}`,
        rawWord.audioViFileName.replace(/^audio_vi\//, ''),
      ];

      for (const p of viAudioPathOptions) {
        const fileInZip = zip.file(p);
        if (fileInZip) {
          try {
            const base64Data = await fileInZip.async('base64');
            const dataUrl = `data:audio/wav;base64,${base64Data}`;
            viAudioUrl = await saveAudioFile(dataUrl);
            break;
          } catch (e) {
            console.error('Error importing vi audio from zip:', p, e);
          }
        }
      }
    }

    processedWords.push({
      id: generateId(),
      term: rawWord.term || '',
      definition: rawWord.definition || '',
      imageUrl,
      audioUrl,
      viAudioUrl,
    });
  }

  return {
    title,
    description,
    words: processedWords.length > 0 ? processedWords : [{ id: generateId(), term: '', definition: '' }],
  };
}
