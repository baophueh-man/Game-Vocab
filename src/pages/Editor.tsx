import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSetById, saveSet, saveImageFile, getImageFile, getAudioFile, saveAudioFile } from '../lib/storage';
import { Word, WordSet } from "../types";
import SmartImage from "../components/ui/SmartImage";
import { generateId } from '../lib/utils';
import { auth } from '../firebase';
import { resizeBase64Image } from '../utils/image';
import { audioDataToWavBytes } from '../utils/audio';
import { Save, Plus, ArrowLeft, Trash2, FileSpreadsheet, Image as ImageIcon, X, Sparkles, Globe, Loader2, Download, Shapes, FileJson, Mic, ClipboardPaste, Music, Package, ChevronUp, ChevronDown, GripVertical, PlusCircle, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ImageSearchModal from '../components/ImageSearchModal';
import AudioModal from '../components/AudioModal';
import BatchAudioModal from '../components/BatchAudioModal';
import { GoogleGenAI } from "@google/genai";
import { exportWordSetPackage, importWordSetPackage } from '../utils/packageZip';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const extractImageUrl = (data: any) => {
  if (data.query && data.query.pages) {
    const pages = Object.values(data.query.pages) as any[];
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (info) {
        const imgUrl = info.url.toLowerCase();
        if (imgUrl.endsWith('.jpg') || imgUrl.endsWith('.jpeg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.gif') || imgUrl.endsWith('.svg')) {
          return info.thumburl || info.url;
        }
      }
    }
  }
  return null;
};

const fetchWebImage = async (word: Word): Promise<string | null> => {
  try {
    // Try searching by term first
    let url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(word.term)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=400&format=json&origin=*`;
    let res = await fetch(url);
    let data = await res.json();
    let imageUrl = extractImageUrl(data);
    
    // Fallback to definition if term yields no results
    if (!imageUrl && word.definition) {
      url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(word.definition)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=400&format=json&origin=*`;
      res = await fetch(url);
      data = await res.json();
      imageUrl = extractImageUrl(data);
    }
    return imageUrl;
  } catch (e) {
    console.error("Web search failed", e);
    return null;
  }
};

const fetchIconImage = async (word: Word): Promise<string | null> => {
  try {
    let searchQuery = word.term;
    
    // Use AI to disambiguate the search query based on both term and definition
    if (word.term && word.definition) {
      try {
        const prompt = `I need to search for an illustrative icon. The English word is "${word.term}" and its Vietnamese definition is "${word.definition}". 
        Provide a single, simple English search keyword (preferably a concrete noun, max 2 words) that visually represents this specific meaning. 
        For example:
        - term="fly", definition="con ruồi" -> "fly insect"
        - term="fly", definition="bay" -> "airplane"
        - term="bee", definition="con ong" -> "honeybee"
        - term="big", definition="to lớn" -> "elephant"
        - term="bank", definition="ngân hàng" -> "bank building"
        Return ONLY the search keyword, nothing else. No quotes.`;
        
        const response = await fetch('/api/generate-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        
        const data = await response.json();
        
        if (data.text) {
          searchQuery = data.text.trim().replace(/['"]/g, '');
          console.log(`Disambiguated "${word.term}" (${word.definition}) -> "${searchQuery}"`);
        }
      } catch (aiError) {
        console.warn("AI disambiguation failed, using original term", aiError);
      }
    }

    const coloredPrefixes = 'twemoji,noto,fluent-emoji,fxemoji,flat-color-icons,emojione,color';
    let url = `https://api.iconify.design/search?query=${encodeURIComponent(searchQuery)}&prefixes=${coloredPrefixes}&limit=20`;
    let res = await fetch(url);
    let data = await res.json();
    
    // Fallback to original term if AI query yields no results
    if ((!data.icons || data.icons.length === 0) && searchQuery !== word.term) {
      url = `https://api.iconify.design/search?query=${encodeURIComponent(word.term)}&prefixes=${coloredPrefixes}&limit=20`;
      res = await fetch(url);
      data = await res.json();
    }

    if (data.icons && data.icons.length > 0) {
      // Since we restricted to colored prefixes, the first result is the most relevant colored icon
      const selectedIcon = data.icons[0];
      const [prefix, name] = selectedIcon.split(':');
      return `https://api.iconify.design/${prefix}/${name}.svg?width=200&height=200`;
    }
    return null;
  } catch (e) {
    console.error("Icon search failed", e);
    return null;
  }
};

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioViInputRef = useRef<HTMLInputElement>(null);
  const packageInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [originalCreatedAt, setOriginalCreatedAt] = useState<number | null>(null);
  const [packageProgressText, setPackageProgressText] = useState<string | null>(null);
  
  // Image search state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [audioLanguage, setAudioLanguage] = useState<'en' | 'vi'>('en');
  const [isBatchAudioModalOpen, setIsBatchAudioModalOpen] = useState(false);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoFillProgress, setAutoFillProgress] = useState({ current: 0, total: 0 });
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteTargetWordId, setPasteTargetWordId] = useState<string | null>(null);
  const [isProcessingPasteImage, setIsProcessingPasteImage] = useState(false);

  useEffect(() => {
    const loadSet = async () => {
      if (id) {
        const set = await getSetById(id);
        if (set) {
          setTitle(set.title);
          setDescription(set.description || '');
          setWords(set.words);
          setOriginalCreatedAt(set.createdAt);
        }
      } else {
        // Initialize with 3 empty rows
        setWords([
          { id: generateId(), term: '', definition: '' },
          { id: generateId(), term: '', definition: '' },
          { id: generateId(), term: '', definition: '' },
        ]);
      }
      setLoading(false);
    };
    loadSet();
  }, [id]);

  const handleAutoFillDefinitionsAll = async () => {
    const wordsToFill = words.filter(w => w.term && !w.definition);
    if (wordsToFill.length === 0) {
      alert('All words already have definitions or are empty.');
      return;
    }

    setIsAutoFilling(true);
    setAutoFillProgress({ current: 0, total: wordsToFill.length });

    try {
      const terms = wordsToFill.map(w => w.term);
      const response = await fetch('/api/generate-definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms })
      });

      if (!response.ok) {
        throw new Error('Failed to call the Gemini API proxy.');
      }

      const data = await response.json();
      
      try {
        const translations = data.translations;
        if (Array.isArray(translations) && translations.length === wordsToFill.length) {
          setWords(prev => prev.map(w => {
            const idx = wordsToFill.findIndex(fillWord => fillWord.id === w.id);
            if (idx !== -1 && translations[idx]) {
              return { ...w, definition: translations[idx] };
            }
            return w;
          }));
        } else {
          throw new Error('Invalid translation format from AI');
        }
      } catch (e) {
        console.error('Failed to parse translations:', e);
        alert('Failed to parse the translations from AI. Please try again.');
      }
    } catch (error) {
      console.error('Auto definition error:', error);
      alert('Failed to call the Gemini API. Please try again.');
    }
    
    setIsAutoFilling(false);
  };

  const handleAIAutoFillAll = async () => {
    const wordsToFill = words.filter(w => w.term && w.definition && !w.imageUrl);
    if (wordsToFill.length === 0) {
      alert('All words already have images or are empty.');
      return;
    }

    setIsAutoFilling(true);
    setAutoFillProgress({ current: 0, total: wordsToFill.length });

    for (let i = 0; i < wordsToFill.length; i++) {
      const word = wordsToFill[i];
      setAutoFillProgress({ current: i + 1, total: wordsToFill.length });
      
      let imageUrl = '';
      let retries = 0;
      let success = false;

      while (!success && retries < 3) {
        try {
          const prompt = `Child-friendly illustration of ${word.definition}, bright colors, purely visual, no text`;
          
          const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
          });

          if (!response.ok) {
            throw new Error(`Proxy error: ${response.statusText}`);
          }

          const data = await response.json();
          if (data.imageBase64) {
            const rawImageUrl = `data:image/png;base64,${data.imageBase64}`;
            imageUrl = await resizeBase64Image(rawImageUrl, 150, 150);
            success = true;
          } else {
            throw new Error('No image returned');
          }
        } catch (error: any) {
          console.warn(`Attempt ${retries + 1} failed for ${word.term}:`, error);
          
          // Fallback to web search if quota is exceeded
          const errorMessage = typeof error === 'object' ? (error?.message || JSON.stringify(error)) : String(error);
          if (errorMessage.toLowerCase().includes('quota') || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            console.log("Quota exceeded, falling back to web search for", word.term);
            const webImageUrl = await fetchWebImage(word);
            if (webImageUrl) {
              imageUrl = webImageUrl;
            }
            success = true; // Break the loop
            break;
          }

          retries++;
          if (retries < 3) {
            // Wait longer on each retry (5s, then 10s)
            await delay(5000 * retries);
          }
        }
      }

      if (imageUrl) {
        setWords(prev => prev.map(w => w.id === word.id ? { ...w, imageUrl } : w));
      }

      // Base delay of 4 seconds to stay under 15 Requests Per Minute limit
      if (i < wordsToFill.length - 1) {
        await delay(4000); 
      }
    }

    setIsAutoFilling(false);
  };

  const handleWebAutoFillAll = async () => {
    const wordsToFill = words.filter(w => w.term && w.definition && !w.imageUrl);
    if (wordsToFill.length === 0) {
      alert('All words already have images or are empty.');
      return;
    }

    setIsAutoFilling(true);
    setAutoFillProgress({ current: 0, total: wordsToFill.length });

    for (let i = 0; i < wordsToFill.length; i++) {
      const word = wordsToFill[i];
      setAutoFillProgress({ current: i + 1, total: wordsToFill.length });
      
      try {
        const webImageUrl = await fetchWebImage(word);
        if (webImageUrl) {
          setWords(prev => prev.map(w => w.id === word.id ? { ...w, imageUrl: webImageUrl } : w));
        }
      } catch (error) {
        console.error('Error searching web image for', word.term, error);
      }
    }

    setIsAutoFilling(false);
  };

  const handleAIAutoFillSingle = async (word: Word) => {
    if (!word.term || !word.definition) {
      alert('Please enter both term and definition first.');
      return;
    }

    setIsAutoFilling(true);

    let imageUrl = '';
    let retries = 0;
    let success = false;

    while (!success && retries < 3) {
      try {
        const prompt = `Child-friendly illustration of ${word.definition}, bright colors, purely visual, no text`;
        
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
          throw new Error(`Proxy error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.imageBase64) {
          const rawImageUrl = `data:image/png;base64,${data.imageBase64}`;
          imageUrl = await resizeBase64Image(rawImageUrl, 150, 150);
          success = true;
        } else {
          throw new Error('No image returned');
        }
      } catch (error: any) {
        console.warn(`Attempt ${retries + 1} failed for ${word.term}:`, error);
        
        // Fallback to web search if quota is exceeded
        const errorMessage = typeof error === 'object' ? (error?.message || JSON.stringify(error)) : String(error);
        if (errorMessage.toLowerCase().includes('quota') || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          console.log("Quota exceeded, falling back to web search for", word.term);
          const webImageUrl = await fetchWebImage(word);
          if (webImageUrl) {
            imageUrl = webImageUrl;
          }
          success = true; // Break the loop
          break;
        }

        retries++;
        if (retries < 3) {
          await delay(5000 * retries);
        } else {
          console.error('Error generating image for', word.term, error);
          alert('Error generating image. Please try again later.');
        }
      }
    }

    if (imageUrl) {
      setWords(prev => prev.map(w => w.id === word.id ? { ...w, imageUrl } : w));
    } else if (retries >= 3) {
      // Alert already shown in catch block
    } else {
      alert('Could not generate image.');
    }

    setIsAutoFilling(false);
  };

  const handleWebAutoFillSingle = async (word: Word) => {
    if (!word.term || !word.definition) {
      alert('Please enter both term and definition first.');
      return;
    }

    setIsAutoFilling(true);

    try {
      const webImageUrl = await fetchWebImage(word);
      if (webImageUrl) {
        setWords(prev => prev.map(w => w.id === word.id ? { ...w, imageUrl: webImageUrl } : w));
      } else {
        alert('Could not find web image.');
      }
    } catch (error) {
      console.error('Error searching web image for', word.term, error);
      alert('Error searching web image.');
    }

    setIsAutoFilling(false);
  };

  const handleIconAutoFillAll = async () => {
    const wordsToFill = words.filter(w => w.term && w.definition && !w.imageUrl);
    if (wordsToFill.length === 0) {
      alert('All words already have images or are empty.');
      return;
    }

    setIsAutoFilling(true);
    setAutoFillProgress({ current: 0, total: wordsToFill.length });

    for (let i = 0; i < wordsToFill.length; i++) {
      const word = wordsToFill[i];
      setAutoFillProgress({ current: i + 1, total: wordsToFill.length });
      
      try {
        const iconUrl = await fetchIconImage(word);
        if (iconUrl) {
          setWords(prev => prev.map(w => w.id === word.id ? { ...w, imageUrl: iconUrl } : w));
        }
      } catch (error) {
        console.error('Error searching icon for', word.term, error);
      }
      
      // Add delay to avoid AI rate limits
      if (i < wordsToFill.length - 1) {
        await delay(2000);
      }
    }

    setIsAutoFilling(false);
  };

  const handleIconAutoFillSingle = async (word: Word) => {
    if (!word.term || !word.definition) {
      alert('Please enter both term and definition first.');
      return;
    }

    setIsAutoFilling(true);

    try {
      const iconUrl = await fetchIconImage(word);
      if (iconUrl) {
        setWords(prev => prev.map(w => w.id === word.id ? { ...w, imageUrl: iconUrl } : w));
      } else {
        alert('Could not find an icon.');
      }
    } catch (error) {
      console.error('Error searching icon for', word.term, error);
      alert('Error searching icon.');
    }

    setIsAutoFilling(false);
  };

  const handleAddRow = () => {
    setWords([...words, { id: generateId(), term: '', definition: '' }]);
  };

  const handleInsertRowAt = (index: number) => {
    setWords((prev) => {
      const updated = [...prev];
      updated.splice(index, 0, { id: generateId(), term: '', definition: '' });
      return updated;
    });
  };

  const handleMoveWord = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === words.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setWords((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    setWords((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRemoveRow = (wordId: string) => {
    setWords(words.filter((w) => w.id !== wordId));
  };

  const handleWordChange = (wordId: string, field: 'term' | 'definition' | 'imageUrl' | 'audioUrl' | 'viAudioUrl', value: string) => {
    setWords(words.map((w) => (w.id === wordId ? { ...w, [field]: value } : w)));
  };

  const openImageSearch = (wordId: string, term: string) => {
    setActiveWordId(wordId);
    setSearchQuery(term);
    setIsImageModalOpen(true);
  };

  const openAudioModal = (wordId: string, term: string, lang: 'en' | 'vi' = 'en') => {
    setActiveWordId(wordId);
    setSearchQuery(term);
    setAudioLanguage(lang);
    setIsAudioModalOpen(true);
  };

  const handleImageSelect = (imageUrl: string) => {
    if (activeWordId) {
      handleWordChange(activeWordId, 'imageUrl', imageUrl);
    }
    setIsImageModalOpen(false);
  };

  const processImageBlob = async (blob: Blob, wordId: string) => {
    setIsProcessingPasteImage(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const resized = await resizeBase64Image(base64Data, 400, 400);
      const firestoreUrl = await saveImageFile(resized);
      handleWordChange(wordId, 'imageUrl', firestoreUrl);
      setIsPasteModalOpen(false);
      setPasteTargetWordId(null);
    } catch (err) {
      console.error('Error processing image blob:', err);
      alert('Không thể xử lý hình ảnh. Vui lòng thử lại với ảnh khác.');
    } finally {
      setIsProcessingPasteImage(false);
    }
  };

  const handlePasteImage = async (wordId: string) => {
    // Attempt direct reading from clipboard if permission is available
    try {
      if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find(t => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            await processImageBlob(blob, wordId);
            return;
          }
        }
      }
    } catch (error: any) {
      console.warn('Direct clipboard read restricted or unavailable, opening paste dialog fallback:', error);
    }

    // Smooth fallback: open paste dialog where native Ctrl+V paste event and file select work 100% in all iframes
    setPasteTargetWordId(wordId);
    setIsPasteModalOpen(true);
  };

  const handleAudioSelect = (audioUrl: string) => {
    if (activeWordId) {
      handleWordChange(activeWordId, audioLanguage === 'vi' ? 'viAudioUrl' : 'audioUrl', audioUrl);
    }
    setIsAudioModalOpen(false);
  };

  const handleRemoveImage = (wordId: string) => {
    setWords(words.map((w) => {
      if (w.id === wordId) {
        const { imageUrl, ...rest } = w;
        return rest;
      }
      return w;
    }));
  };

  const handleRemoveAudio = (wordId: string, lang: 'en' | 'vi' = 'en') => {
    setWords(words.map((w) => {
      if (w.id === wordId) {
        if (lang === 'vi') {
          const { viAudioUrl, ...rest } = w;
          return rest;
        } else {
          const { audioUrl, ...rest } = w;
          return rest;
        }
      }
      return w;
    }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (title.length > 100) {
      alert('Title cannot exceed 100 characters');
      return;
    }
    if (description.length > 500) {
      alert('Description cannot exceed 500 characters');
      return;
    }

    const validWords = words.filter((w) => w.term.trim() || w.definition.trim());
    if (validWords.length < 2) {
      alert('Please add at least 2 words to play games');
      return;
    }
    if (validWords.length > 100) {
      alert('A set can have a maximum of 100 words');
      return;
    }

    setIsSaving(true);
    const newSet: WordSet = {
      id: id || generateId(),
      title,
      description,
      words: validWords,
      createdAt: originalCreatedAt || Date.now(),
      userId: auth.currentUser?.uid || 'guest',
    };

    try {
      await saveSet(newSet);
      navigate('/');
    } catch (error) {
      console.error('Failed to save set:', error);
      alert('Không thể lưu bộ từ vựng. Đã xảy ra lỗi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Term (English)', 'Definition (Vietnamese)'],
      ['Hello', 'Xin chào'],
      ['Goodbye', 'Tạm biệt'],
      ['Thank you', 'Cảm ơn']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'vocabulary_template.xlsx');
  };

  
  const handleExportHtml = async () => {
    const validWords = words.filter(w => w.term.trim() || w.definition.trim());
    if (validWords.length === 0) {
      alert('Không có từ vựng nào để xuất.');
      return;
    }

    try {
      setIsAutoFilling(true);
      
      let cardsHtml = '';
      
      for (const word of validWords) {
        // Resolve Image
        let imgSrc = '';
        if (word.imageUrl) {
          if (word.imageUrl.startsWith('data:image')) {
            imgSrc = word.imageUrl;
          } else if (word.imageUrl.startsWith('firestore://')) {
            const id = word.imageUrl.split('/').pop();
            if (id) {
              const base64 = await getImageFile(id);
              if (base64) imgSrc = base64;
            }
          } else {
            imgSrc = word.imageUrl;
          }
        }
        
        // Resolve Audio EN
        let audioEnSrc = '';
        if (word.audioUrl) {
          if (word.audioUrl.startsWith('data:audio')) {
            audioEnSrc = word.audioUrl;
          } else if (word.audioUrl.startsWith('firestore://')) {
            const id = word.audioUrl.split('/').pop();
            if (id) {
              const base64 = await getAudioFile(id);
              if (base64) audioEnSrc = base64;
            }
          } else {
            audioEnSrc = word.audioUrl;
          }
        }
        
        // Resolve Audio VI
        let audioViSrc = '';
        if (word.viAudioUrl) {
          if (word.viAudioUrl.startsWith('data:audio')) {
            audioViSrc = word.viAudioUrl;
          } else if (word.viAudioUrl.startsWith('firestore://')) {
            const id = word.viAudioUrl.split('/').pop();
            if (id) {
              const base64 = await getAudioFile(id);
              if (base64) audioViSrc = base64;
            }
          } else {
            audioViSrc = word.viAudioUrl;
          }
        }
        
        cardsHtml += `
          <div class="card">
            ${imgSrc ? `<img src="${imgSrc}" class="card-img" alt="${word.term}">` : `<div class="card-img no-img">No Image</div>`}
            <div class="card-content">
              <h2 class="term">${word.term || ''}</h2>
              <p class="definition">${word.definition || ''}</p>
            </div>
            ${(audioEnSrc || audioViSrc) ? `
            <div class="audio-controls">
              ${audioEnSrc ? `
                <button class="audio-btn" onclick="playAudio('audio_en_${word.id}')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                  EN
                </button>
                <audio id="audio_en_${word.id}" src="${audioEnSrc}"></audio>
              ` : ''}
              ${audioViSrc ? `
                <button class="audio-btn" onclick="playAudio('audio_vi_${word.id}')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                  VI
                </button>
                <audio id="audio_vi_${word.id}" src="${audioViSrc}"></audio>
              ` : ''}
            </div>
            ` : ''}
          </div>
        `;
      }
      
      const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title || 'Flashcards'}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 2rem; margin: 0; }
  .container { max-width: 1200px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 3rem; }
  .header h1 { font-size: 2.5rem; margin: 0 0 0.5rem 0; color: #0f172a; }
  .header p { font-size: 1.125rem; color: #64748b; margin: 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
  .card { background: white; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s; }
  .card:hover { transform: translateY(-4px); }
  .card-img { width: 100%; height: 240px; object-fit: cover; background: #f1f5f9; }
  .card-img.no-img { display: flex; align-items: center; justify-content: center; color: #94a3b8; font-weight: 500; }
  .card-content { padding: 1.5rem; text-align: center; flex-grow: 1; }
  .term { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.5rem 0; color: #1e293b; }
  .definition { font-size: 1.25rem; color: #64748b; margin: 0; }
  .audio-controls { display: flex; justify-content: center; gap: 1rem; padding: 1.25rem; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  .audio-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 9999px; border: 1px solid #e2e8f0; background: white; color: #475569; cursor: pointer; font-size: 0.875rem; font-weight: 600; transition: all 0.2s; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
  .audio-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
  .audio-btn:active { transform: scale(0.95); }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title || 'Flashcards'}</h1>
      ${description ? `<p>${description}</p>` : ''}
    </div>
    <div class="grid">
      ${cardsHtml}
    </div>
  </div>
  
  <script>
    function playAudio(id) {
      const audio = document.getElementById(id);
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.error("Audio play failed:", e));
      }
    }
  </script>
</body>
</html>`;

      const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8' });
      saveAs(blob, title.trim() ? `${title.replace(/[^a-z0-9]/gi, '_')}.html` : 'flashcards.html');
      
    } catch (error) {
      console.error('Error exporting HTML:', error);
      alert('Có lỗi xảy ra khi xuất HTML.');
    } finally {
      setIsAutoFilling(false);
    }
  };


  const handleExportExcel = () => {
    const validWords = words.filter(w => w.term.trim() || w.definition.trim());
    if (validWords.length === 0) {
      alert('Không có từ vựng nào để xuất.');
      return;
    }
    
    const wsData = [
      ['Term (English)', 'Definition (Vietnamese)'],
      ...validWords.map(w => [w.term, w.definition])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vocabulary');
    
    const fileName = title.trim() ? `${title}.xlsx` : 'vocabulary_export.xlsx';
    XLSX.writeFile(wb, fileName);
  };

  const handleExportJson = () => {
    const validWords = words.filter(w => w.term.trim() || w.definition.trim());
    if (validWords.length === 0) {
      alert('Không có từ vựng nào để xuất.');
      return;
    }
    
    const jsonData = validWords.map(w => {
      const item: any = {
        text: w.term,
        translation: w.definition
      };
      if (w.imageUrl) {
        item.imageUrl = w.imageUrl;
      }
      return item;
    });
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = title.trim() ? `${title}.json` : 'vocabulary_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];

      // Assuming row 1 is header, or just try to detect
      // We look for 2 columns.
      const newWords: Word[] = [];
      
      data.forEach((row) => {
        if (row.length >= 2) {
          const term = String(row[0] || '').trim();
          const def = String(row[1] || '').trim();
          if (term && def) {
            newWords.push({
              id: generateId(),
              term,
              definition: def
            });
          }
        }
      });

      if (newWords.length > 0) {
        setWords((prev) => [...prev, ...newWords]);
      } else {
        alert('Could not find valid data in the file. Ensure you have two columns: English and Vietnamese.');
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleJsonSubmit = () => {
    if (!jsonInputText.trim()) {
      alert('Please paste some JSON data first.');
      return;
    }

    try {
      const data = JSON.parse(jsonInputText);
      
      if (!Array.isArray(data)) {
        alert('Invalid JSON format. Expected an array of objects.');
        return;
      }

      const newWords: Word[] = data.map((item: any) => {
        let imageUrl = '';
        if (item.icon && item.icon.type === 'emoji' && item.icon.value) {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="80">${item.icon.value}</text></svg>`;
          imageUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
        } else if (item.imageUrl) {
          imageUrl = item.imageUrl;
        }

        return {
          id: generateId(),
          term: item.text || item.term || '',
          definition: item.translation || item.definition || '',
          imageUrl: imageUrl
        };
      }).filter(w => w.term && w.definition);

      if (newWords.length > 0) {
        setWords((prev) => {
          // Remove empty placeholder rows if they exist
          const filteredPrev = prev.filter(w => w.term.trim() || w.definition.trim());
          return [...filteredPrev, ...newWords];
        });
        setIsJsonModalOpen(false);
        setJsonInputText('');
      } else {
        alert('Could not find valid data in the JSON text.');
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
      alert('Invalid JSON format. Please check your syntax.');
    }
  };

  const handleExportImages = async () => {
    const validWords = words.filter(w => w.term.trim() && w.imageUrl);
    if (validWords.length === 0) {
      alert('Không có ảnh nào để xuất.');
      return;
    }

    try {
      setIsAutoFilling(true);
      const zip = new JSZip();
      const folder = zip.folder("flashcard_images");
      
      for (const word of validWords) {
        if (!word.imageUrl) continue;
        
        let safeName = word.term.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        if (word.imageUrl.startsWith('data:image')) {
          const match = word.imageUrl.match(/^data:image\/(\w+);base64,/);
          const ext = match ? match[1] : 'png';
          const base64Data = word.imageUrl.replace(/^data:image\/\w+;base64,/, '');
          folder?.file(`${safeName}.${ext}`, base64Data, { base64: true });
        } else if (word.imageUrl.startsWith('firestore://')) {
          try {
            const id = word.imageUrl.split('/').pop();
            if (id) {
              const base64DataWithPrefix = await getImageFile(id);
              if (base64DataWithPrefix) {
                const match = base64DataWithPrefix.match(/^data:image\/(\w+);base64,/);
                const ext = match ? match[1] : 'png';
                const base64Data = base64DataWithPrefix.replace(/^data:image\/\w+;base64,/, '');
                folder?.file(`${safeName}.${ext}`, base64Data, { base64: true });
              }
            }
          } catch (e) {
            console.error('Failed to fetch firestore image for', word.term, e);
          }
        } else {
          try {
            // Try fetching via proxy to bypass CORS
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(word.imageUrl)}`;
            let response = await fetch(proxyUrl);
            
            if (!response.ok) {
               // Fallback to direct fetch
               response = await fetch(word.imageUrl);
            }
            
            if (response.ok) {
              const blob = await response.blob();
              let ext = 'png';
              if (blob.type === 'image/jpeg') ext = 'jpg';
              else if (blob.type === 'image/svg+xml') ext = 'svg';
              folder?.file(`${safeName}.${ext}`, blob);
            } else {
              throw new Error(`Failed to fetch: ${response.statusText}`);
            }
          } catch (e) {
            console.error('Failed to fetch image for', word.term, e);
          }
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, title.trim() ? `${title.replace(/[^a-z0-9]/gi, '_')}_images.zip` : 'flashcard_images.zip');
    } catch (error) {
      console.error('Error exporting images:', error);
      alert('Có lỗi xảy ra khi xuất ảnh.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleExportAudio = async () => {
    const validWords = words.filter(w => w.term.trim() && w.audioUrl);
    if (validWords.length === 0) {
      alert('Không có âm thanh tiếng Anh nào để xuất.');
      return;
    }

    try {
      setIsAutoFilling(true);
      const zip = new JSZip();
      const folder = zip.folder("flashcard_audio_en");
      
      for (const word of validWords) {
        if (!word.audioUrl) continue;
        
        let safeName = word.term.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'audio_en';
        
        try {
          let rawAudioSource = word.audioUrl;
          if (word.audioUrl.startsWith('firestore://')) {
            const id = word.audioUrl.split('/').pop();
            if (id) {
              const base64DataWithPrefix = await getAudioFile(id);
              if (base64DataWithPrefix) {
                rawAudioSource = base64DataWithPrefix;
              }
            }
          }
          
          const wavBytes = await audioDataToWavBytes(rawAudioSource);
          folder?.file(`${safeName}.wav`, wavBytes);
        } catch (e) {
          console.error('Failed to convert and export audio for', word.term, e);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, title.trim() ? `${title.replace(/[^a-z0-9]/gi, '_')}_audio_en_wav.zip` : 'flashcard_audio_en_wav.zip');
    } catch (error) {
      console.error('Error exporting audio:', error);
      alert('Có lỗi xảy ra khi xuất âm thanh.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  
  const handleExportAudioVi = async () => {
    const validWords = words.filter(w => (w.term.trim() || w.definition.trim()) && w.viAudioUrl);
    if (validWords.length === 0) {
      alert('Không có âm thanh tiếng Việt nào để xuất.');
      return;
    }

    try {
      setIsAutoFilling(true);
      const zip = new JSZip();
      const folder = zip.folder("flashcard_audio_vi");
      
      for (const word of validWords) {
        if (!word.viAudioUrl) continue;
        
        let safeName = (word.term || word.definition).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'audio_vi';
        
        try {
          let rawAudioSource = word.viAudioUrl;
          if (word.viAudioUrl.startsWith('firestore://')) {
            const id = word.viAudioUrl.split('/').pop();
            if (id) {
              const base64DataWithPrefix = await getAudioFile(id);
              if (base64DataWithPrefix) {
                rawAudioSource = base64DataWithPrefix;
              }
            }
          }
          
          const wavBytes = await audioDataToWavBytes(rawAudioSource);
          folder?.file(`${safeName}.wav`, wavBytes);
        } catch (e) {
          console.error('Failed to convert and export vi audio for', word.term, e);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, title.trim() ? `${title.replace(/[^a-z0-9]/gi, '_')}_audio_vi_wav.zip` : 'flashcard_audio_vi_wav.zip');
    } catch (error) {
      console.error('Error exporting vi audio:', error);
      alert('Có lỗi xảy ra khi xuất âm thanh tiếng Việt.');
    } finally {
      setIsAutoFilling(false);
    }
  };


  const handleImportAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsAutoFilling(true);
    setAutoFillProgress({ current: 0, total: files.length });
    
    try {
      const newWords = [...words];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setAutoFillProgress({ current: i + 1, total: files.length });
        
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // strip extension
        
        const rawBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        // Save to firestore
        const firestoreUrl = await saveAudioFile(rawBase64);
        
        const safeFileName = fileName.replace(/[^a-z0-9]/gi, '').toLowerCase();
        
        // Match word
        const matchingWordIndex = newWords.findIndex(w => w.term.replace(/[^a-z0-9]/gi, '').toLowerCase() === safeFileName);
        
        if (matchingWordIndex !== -1) {
          newWords[matchingWordIndex] = { ...newWords[matchingWordIndex], audioUrl: firestoreUrl };
        } else {
          const emptyIndex = newWords.findIndex(w => !w.audioUrl && w.term);
          if (emptyIndex !== -1) {
            newWords[emptyIndex] = { ...newWords[emptyIndex], audioUrl: firestoreUrl };
          } else {
            newWords.push({
              id: generateId(),
              term: fileName,
              definition: '',
              audioUrl: firestoreUrl
            });
          }
        }
      }
      setWords(newWords);
    } catch (error) {
      console.error('Error importing audio:', error);
      alert('Có lỗi xảy ra khi nhập âm thanh.');
    } finally {
      setIsAutoFilling(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  
  const handleImportAudioVi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsAutoFilling(true);
    setAutoFillProgress({ current: 0, total: files.length });
    
    try {
      const newWords = [...words];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setAutoFillProgress({ current: i + 1, total: files.length });
        
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // strip extension
        
        const rawBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        // Save to firestore
        const firestoreUrl = await saveAudioFile(rawBase64);
        
        const safeFileName = fileName.replace(/[^a-z0-9]/gi, '').toLowerCase();
        
        // Match word
        const matchingWordIndex = newWords.findIndex(w => w.term.replace(/[^a-z0-9]/gi, '').toLowerCase() === safeFileName);
        
        if (matchingWordIndex !== -1) {
          newWords[matchingWordIndex] = { ...newWords[matchingWordIndex], viAudioUrl: firestoreUrl };
        } else {
          const emptyIndex = newWords.findIndex(w => !w.viAudioUrl && w.term);
          if (emptyIndex !== -1) {
            newWords[emptyIndex] = { ...newWords[emptyIndex], viAudioUrl: firestoreUrl };
          } else {
            newWords.push({
              id: generateId(),
              term: fileName,
              definition: '',
              viAudioUrl: firestoreUrl
            });
          }
        }
      }
      setWords(newWords);
    } catch (error) {
      console.error('Error importing vi audio:', error);
      alert('Có lỗi xảy ra khi nhập âm thanh tiếng Việt.');
    } finally {
      setIsAutoFilling(false);
      if (audioViInputRef.current) audioViInputRef.current.value = '';
    }
  };


  const handleImportImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsAutoFilling(true);
    setAutoFillProgress({ current: 0, total: files.length });
    
    try {
      const newWords = [...words];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setAutoFillProgress({ current: i + 1, total: files.length });
        
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // strip extension
        
        const rawBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        // Save to firestore
        const firestoreUrl = await saveImageFile(rawBase64);
        
        const safeFileName = fileName.replace(/[^a-z0-9]/gi, '').toLowerCase();
        
        // Match word
        const matchingWordIndex = newWords.findIndex(w => w.term.replace(/[^a-z0-9]/gi, '').toLowerCase() === safeFileName);
        
        if (matchingWordIndex !== -1) {
          newWords[matchingWordIndex] = { ...newWords[matchingWordIndex], imageUrl: firestoreUrl };
        } else {
          const emptyIndex = newWords.findIndex(w => !w.imageUrl && w.term);
          if (emptyIndex !== -1) {
            newWords[emptyIndex] = { ...newWords[emptyIndex], imageUrl: firestoreUrl };
          } else {
            newWords.push({
              id: generateId(),
              term: fileName,
              definition: '',
              imageUrl: firestoreUrl
            });
          }
        }
      }
      setWords(newWords);
    } catch (error) {
      console.error('Error importing images:', error);
      alert('Có lỗi xảy ra khi nhập ảnh.');
    } finally {
      setIsAutoFilling(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleExportPackage = async () => {
    const validWords = words.filter(w => w.term.trim() || w.definition.trim() || w.imageUrl || w.audioUrl || w.viAudioUrl);
    if (validWords.length === 0) {
      alert('Không có từ vựng nào để xuất gói.');
      return;
    }

    try {
      setIsAutoFilling(true);
      await exportWordSetPackage(title, description, words, (curr, total, msg) => {
        setAutoFillProgress({ current: curr, total });
        setPackageProgressText(msg);
      });
    } catch (error) {
      console.error('Error exporting package:', error);
      alert('Có lỗi xảy ra khi xuất gói ZIP.');
    } finally {
      setIsAutoFilling(false);
      setPackageProgressText(null);
    }
  };

  const handleImportPackage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsAutoFilling(true);
      const result = await importWordSetPackage(file, (curr, total, msg) => {
        setAutoFillProgress({ current: curr, total });
        setPackageProgressText(msg);
      });

      if (result.words && result.words.length > 0) {
        if (!title.trim() || title === 'Untitled Set') {
          setTitle(result.title);
        }
        if (!description.trim()) {
          setDescription(result.description);
        }
        setWords(result.words);
        alert(`Đã nhập thành công gói ZIP với ${result.words.length} từ vựng, hình ảnh và âm thanh!`);
      }
    } catch (error: any) {
      console.error('Error importing package:', error);
      alert(error?.message || 'Có lỗi xảy ra khi nhập gói ZIP.');
    } finally {
      setIsAutoFilling(false);
      setPackageProgressText(null);
      if (packageInputRef.current) packageInputRef.current.value = '';
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-slate-500 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{id ? 'Edit Set' : 'Create New Set'}</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Set
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Animals, Unit 1, Common Verbs"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this set about?"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-20 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              Vocabulary List
              {isAutoFilling && (
                <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  {packageProgressText || `Processing ${autoFillProgress.current}/${autoFillProgress.total}`}
                </span>
              )}
            </h2>
            <div className="text-xs text-slate-500 hidden sm:block">
              Format: Column A (English), Column B (Vietnamese)
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full mt-2 sm:mt-0">
            {/* Auto Tools Group */}
            <div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end bg-slate-100 p-2 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase mx-2">Auto</span>
              <button
                onClick={handleAutoFillDefinitionsAll}
                disabled={isAutoFilling}
                className="text-xs bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                title="Translate English terms to Vietnamese definitions"
              >
                {isAutoFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                Definition (VI)
              </button>
              <button
                onClick={handleAIAutoFillAll}
                disabled={isAutoFilling}
                className="text-xs bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                title="Generate images using AI for missing words"
              >
                {isAutoFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
                AI Image
              </button>
              <button
                onClick={handleIconAutoFillAll}
                disabled={isAutoFilling}
                className="text-xs bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                title="Search illustrative icons for missing words"
              >
                {isAutoFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shapes className="w-3.5 h-3.5 text-emerald-500" />}
                Icon
              </button>
              <button
                onClick={handleWebAutoFillAll}
                disabled={isAutoFilling}
                className="text-xs bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                title="Search web images for missing words"
              >
                {isAutoFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5 text-blue-500" />}
                Web Image
              </button>
              <button
                onClick={() => setIsBatchAudioModalOpen(true)}
                className="text-xs bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Mic className="w-3.5 h-3.5 text-purple-600" />
                Audio
              </button>
            </div>

            {/* Import Tools Group */}
            <div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end bg-slate-100 p-2 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase mx-2">Import</span>
              <button
                onClick={() => packageInputRef.current?.click()}
                disabled={isAutoFilling}
                title="Nhập trọn gói 1-Click: Tự động nạp từ vựng, hình ảnh, âm thanh EN & VI từ file .zip"
                className="text-xs bg-indigo-50 border border-indigo-300 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                Gói ZIP (1-Click)
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                Excel
              </button>
              <button
                onClick={() => setIsJsonModalOpen(true)}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <FileJson className="w-3.5 h-3.5 text-amber-600" />
                JSON
              </button>
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={isAutoFilling}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                Images
              </button>
              <button
                onClick={() => audioInputRef.current?.click()}
                disabled={isAutoFilling}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Music className="w-3.5 h-3.5 text-pink-500" />
                Audio
              </button>
              <button
                onClick={() => audioViInputRef.current?.click()}
                disabled={isAutoFilling}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Music className="w-3.5 h-3.5 text-orange-500" />
                Audio (VI)
              </button>

            </div>

            {/* Export Tools Group */}
            <div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end bg-slate-100 p-2 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase mx-2">Export</span>
              <button
                onClick={handleExportPackage}
                disabled={isAutoFilling}
                title="Xuất trọn gói 1-Click: Đóng gói toàn bộ từ vựng, hình ảnh, âm thanh EN & VI thành 1 file .zip"
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Package className="w-3.5 h-3.5 text-white" />
                Xuất Gói ZIP (1-Click)
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline mr-2"
              >
                Template
              </button>
              
              <button
                onClick={handleExportHtml}
                disabled={isAutoFilling}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                HTML
              </button>

<button
                onClick={handleExportExcel}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                Excel
              </button>
              <button
                onClick={handleExportJson}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-600" />
                JSON
              </button>
              <button
                onClick={handleExportImages}
                disabled={isAutoFilling}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                Images
              </button>
              <button
                onClick={handleExportAudio}
                disabled={isAutoFilling}
                title="Xuất tất cả âm thanh tiếng Anh định dạng .wav"
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-pink-500" />
                Audio EN (.wav)
              </button>
              <button
                onClick={handleExportAudioVi}
                disabled={isAutoFilling}
                title="Xuất tất cả âm thanh tiếng Việt định dạng .wav"
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-orange-500" />
                Audio VI (.wav)
              </button>

            </div>

            <input
              type="file"
              accept=".zip"
              ref={packageInputRef}
              className="hidden"
              onChange={handleImportPackage}
            />
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />
            <input
              type="file"
              accept="image/*"
              multiple
              ref={imageInputRef}
              className="hidden"
              onChange={handleImportImages}
            />
            <input
              type="file"
              accept="audio/*"
              multiple
              ref={audioInputRef}
              className="hidden"
              onChange={handleImportAudio}
            />
            <input
              type="file"
              accept="audio/*"
              multiple
              ref={audioViInputRef}
              className="hidden"
              onChange={handleImportAudioVi}
            />

          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-3">Term (English)</div>
            <div className="col-span-3">Definition (Vietnamese)</div>
            <div className="col-span-2 text-center">Image</div>
            <div className="col-span-2 text-center">Audio</div>
            <div className="col-span-1"></div>
          </div>
          
          {words.map((word, index) => {
            const isDragging = draggedIndex === index;
            const isOver = dragOverIndex === index && draggedIndex !== index;
            return (
              <div
                key={word.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-slate-50 transition-all group ${
                  isDragging ? 'opacity-40 bg-slate-100' : ''
                } ${isOver ? 'border-t-2 border-indigo-500 bg-indigo-50/50' : ''}`}
              >
                <div className="col-span-1 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-0.5 rounded transition-colors"
                    title="Giữ và kéo thả để thay đổi vị trí"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-400 font-mono text-xs w-4 text-center">{index + 1}</span>
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveWord(index, 'up')}
                      className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 rounded"
                      title="Di chuyển lên (Move Up)"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === words.length - 1}
                      onClick={() => handleMoveWord(index, 'down')}
                      className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 rounded"
                      title="Di chuyển xuống (Move Down)"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={word.term}
                    onChange={(e) => handleWordChange(word.id, 'term', e.target.value)}
                    placeholder="Enter term"
                    className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none py-1 px-1 transition-colors"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={word.definition}
                    onChange={(e) => handleWordChange(word.id, 'definition', e.target.value)}
                    placeholder="Enter definition"
                    className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none py-1 px-1 transition-colors"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  {word.imageUrl ? (
                    <div className="relative group/img">
                      <SmartImage 
                        src={word.imageUrl} 
                        alt={word.term} 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-sm"
                      />
                      <button
                        onClick={() => handleRemoveImage(word.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAIAutoFillSingle(word)}
                        disabled={isAutoFilling}
                        className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:opacity-50 flex items-center justify-center transition-colors"
                        title="AI Auto-fill"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleIconAutoFillSingle(word)}
                        disabled={isAutoFilling}
                        className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 flex items-center justify-center transition-colors"
                        title="Icon Auto-fill"
                      >
                        <Shapes className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleWebAutoFillSingle(word)}
                        disabled={isAutoFilling}
                        className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 flex items-center justify-center transition-colors"
                        title="Web Auto-fill"
                      >
                        <Globe className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openImageSearch(word.id, word.definition)}
                        disabled={isAutoFilling}
                        className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                        title="Manual Search"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePasteImage(word.id)}
                        disabled={isAutoFilling}
                        className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                        title="Paste Image from Clipboard"
                      >
                        <ClipboardPaste className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="col-span-2 flex justify-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-medium">EN</span>
                    {word.audioUrl ? (
                      <div className="relative group/audio">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                          <Mic className="w-4 h-4" />
                        </div>
                        <button
                          onClick={() => handleRemoveAudio(word.id, 'en')}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/audio:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAudioModal(word.id, word.term, 'en')}
                        disabled={isAutoFilling}
                        className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                        title="Add English Audio"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-medium">VN</span>
                    {word.viAudioUrl ? (
                      <div className="relative group/viaudio">
                        <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                          <Mic className="w-4 h-4" />
                        </div>
                        <button
                          onClick={() => handleRemoveAudio(word.id, 'vi')}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/viaudio:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openAudioModal(word.id, word.definition, 'vi')}
                        disabled={isAutoFilling}
                        className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        title="Add Vietnamese Audio"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleInsertRowAt(index + 1)}
                    className="text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Chèn thêm thẻ mới ngay sau thẻ này"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(word.id)}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Xoá thẻ này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={handleAddRow}
            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Card
          </button>
        </div>
      </div>

      {isImageModalOpen && (
        <ImageSearchModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          onSelect={handleImageSelect}
          initialQuery={searchQuery}
        />
      )}

      {isAudioModalOpen && (
        <AudioModal
          isOpen={isAudioModalOpen}
          onClose={() => setIsAudioModalOpen(false)}
          onSelect={handleAudioSelect}
          term={searchQuery}
        />
      )}

      {isBatchAudioModalOpen && (
        <BatchAudioModal
          isOpen={isBatchAudioModalOpen}
          onClose={() => setIsBatchAudioModalOpen(false)}
          words={words}
          onWordAudioGenerated={(wordId, audioUrl, targetLang) => {
            setWords(prevWords => prevWords.map(w => 
              w.id === wordId ? { ...w, [targetLang === 'en' ? 'audioUrl' : 'viAudioUrl']: audioUrl } : w
            ));
          }}
        />
      )}

      {isJsonModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">Paste JSON Data</h3>
              <button onClick={() => setIsJsonModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <p className="text-sm text-slate-600 mb-2">Paste your JSON array here. It should contain objects with <code>text</code> (or <code>term</code>) and <code>translation</code> (or <code>definition</code>).</p>
              <textarea
                value={jsonInputText}
                onChange={(e) => setJsonInputText(e.target.value)}
                className="w-full h-64 p-3 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                placeholder="[\n  {\n    &quot;text&quot;: &quot;apple&quot;,\n    &quot;translation&quot;: &quot;quả táo&quot;,\n    &quot;icon&quot;: { &quot;type&quot;: &quot;emoji&quot;, &quot;value&quot;: &quot;🍎&quot; }\n  }\n]"
              />
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJsonSubmit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {isPasteModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setIsPasteModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            onPaste={(e) => {
              const items = e.clipboardData?.items;
              if (items) {
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    if (file && pasteTargetWordId) {
                      e.preventDefault();
                      processImageBlob(file, pasteTargetWordId);
                      return;
                    }
                  }
                }
              }
            }}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Dán hoặc Tải ảnh lên</h3>
                  <p className="text-xs text-slate-500">
                    {pasteTargetWordId ? words.find(w => w.id === pasteTargetWordId)?.term || 'Thẻ từ vựng' : ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPasteModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div 
                tabIndex={0}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = e.dataTransfer?.files;
                  if (files && files.length > 0 && files[0].type.startsWith('image/') && pasteTargetWordId) {
                    processImageBlob(files[0], pasteTargetWordId);
                  }
                }}
                className="border-2 border-dashed border-indigo-300 bg-indigo-50/30 rounded-xl p-6 text-center flex flex-col items-center justify-center hover:bg-indigo-50/60 hover:border-indigo-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {isProcessingPasteImage ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-sm font-medium text-indigo-700">Đang xử lý và lưu hình ảnh...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 mb-4">
                      <p className="text-sm font-semibold text-slate-800">
                        Nhấn <kbd className="px-2 py-0.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded shadow-xs">Ctrl + V</kbd> (hoặc <kbd className="px-2 py-0.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded shadow-xs">⌘ + V</kbd>)
                      </p>
                      <p className="text-xs text-slate-500">để dán ảnh trực tiếp từ bộ nhớ tạm</p>
                    </div>
                    <div className="flex items-center gap-2 w-full my-2">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">hoặc</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-xs cursor-pointer transition-colors">
                      <ImageIcon className="w-4 h-4 text-indigo-500" />
                      <span>Chọn ảnh từ máy tính</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && pasteTargetWordId) {
                            processImageBlob(file, pasteTargetWordId);
                          }
                        }}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
