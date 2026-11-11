import { collection, doc, setDoc, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { WordSet } from '../types';
import { L3_U5_SET, L3_U5_IMAGES } from '../data/l3_u5';
import { L3_U6_SET, L3_U6_IMAGES } from '../data/l3_u6';
import { L3_U7_SET, L3_U7_IMAGES } from '../data/l3_u7';
import {
  idbSaveSet,
  idbGetSet,
  idbGetAllSets,
  idbDeleteSet,
  idbSaveImage,
  idbGetImage,
  idbSaveAudio,
  idbGetAudio,
  purgeLocalStorageCaches,
} from './indexedDb';

export const PRESET_SETS: WordSet[] = [L3_U7_SET, L3_U5_SET, L3_U6_SET];
const PRESET_SET_IDS = new Set(PRESET_SETS.map((s) => s.id));

function wrapTermInSentence(sentence: string, term: string): string {
  if (/<#[\s\S]*?#>/.test(sentence)) return sentence;
  const cleanTerm = (term || '').trim();
  if (!cleanTerm) return sentence;
  const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const termRegex = new RegExp(`(?<=[^a-zA-Z0-9]|^)(${escaped}(?:s|es|d|ed|ing)?)(?=[^a-zA-Z0-9]|$)`, 'i');
  let m = termRegex.exec(sentence);
  if (!m) {
    const stdRegex = new RegExp(`\\b(${escaped})\\b`, 'i');
    m = stdRegex.exec(sentence);
  }
  if (m && m.index !== undefined) {
    return `${sentence.substring(0, m.index)}<#${m[1]}#>${sentence.substring(m.index + m[0].length)}`;
  }
  return sentence;
}

export function buildSmartFallbackSentence(term: string, definition?: string): string {
  const clean = (term || '').trim();
  if (!clean) return '';
  const norm = clean.toLowerCase();
  const defNorm = (definition || '').toLowerCase();

  const ADJECTIVES = new Set([
    'red', 'blue', 'green', 'yellow', 'pink', 'brown', 'black', 'white', 'purple',
    'big', 'small', 'tall', 'short', 'hot', 'cold', 'new', 'old', 'good', 'bad', 'happy', 'sad',
    'fast', 'slow', 'nice', 'warm', 'cool', 'clean', 'dirty', 'sweet', 'quiet'
  ]);
  if (ADJECTIVES.has(norm) || (norm === 'orange' && /màu|color/.test(defNorm))) {
    return `It is <#${clean}#>.`;
  }

  if (norm.endsWith('ing') && norm.length > 4) {
    return `I like <#${clean}#>.`;
  }

  const isPlural = norm.length > 2 && norm.endsWith('s') && !norm.endsWith('ss') && !norm.endsWith('us') && !norm.endsWith('is');
  if (isPlural) {
    return `They are <#${clean}#>.`;
  }

  if (/^[aeiou]/i.test(clean)) {
    return `It is an <#${clean}#>.`;
  }

  return `It is a <#${clean}#>.`;
}

export interface RepairResult {
  repairedSets: WordSet[];
  modifiedSets: WordSet[];
}

/**
 * [FEATURE-MAP: ID-05] 3-Tier Sentence Recovery and Cross-Set Dictionary Synchronization:
 * 1. Tier 1 (Shifted phonetic recovery): If !exampleSentence and phonetic contains spaces without /.../ or [...], restore as exampleSentence.
 * 2. Tier 2 (Cross-Set Dictionary Recovery): Lookup term in dictionary built from presets and all active decks to restore missing sentences/translations/phonetics.
 * 3. Tier 3 (Smart Flashcard Sentence Fallback): If still missing exampleSentence, generate elementary grammar sentence with <#term#>.
 */
export function recoverAndRepairWordSets(sets: WordSet[]): RepairResult {
  if (!Array.isArray(sets)) {
    return { repairedSets: [], modifiedSets: [] };
  }

  // Step 0: Build cross-set lookup dictionary from PRESET_SETS and all input sets
  const dictionary = new Map<string, { exampleSentence: string; exampleTranslation?: string; phonetic?: string }>();

  const registerWordToDict = (w: any, isPreset = false) => {
    if (!w || !w.term) return;
    const key = w.term.trim().toLowerCase();
    if (!key) return;

    const rawPhonetic = (w.phonetic || '').trim();
    const isShiftedPhonetic = Boolean(rawPhonetic && /\s/.test(rawPhonetic) && !/^\/.*\/$/.test(rawPhonetic) && !/^\[.*\]$/.test(rawPhonetic));
    const phonetic = isShiftedPhonetic ? '' : rawPhonetic;

    const sentence = (
      w.exampleSentence ||
      w.sentence ||
      w.example ||
      w.contextSentence ||
      (isShiftedPhonetic ? rawPhonetic : '') ||
      ''
    ).trim();
    const translation = (w.exampleTranslation || '').trim();

    if (sentence) {
      const existing = dictionary.get(key);
      if (!existing || isPreset || (translation && !existing.exampleTranslation)) {
        dictionary.set(key, {
          exampleSentence: sentence,
          exampleTranslation: translation || existing?.exampleTranslation,
          phonetic: phonetic || existing?.phonetic,
        });
      }
    } else if (phonetic && !dictionary.has(key)) {
      dictionary.set(key, {
        exampleSentence: '',
        phonetic,
      });
    }
  };

  PRESET_SETS.forEach((p) => p.words?.forEach((w) => registerWordToDict(w, true)));
  sets.forEach((s) => s.words?.forEach((w) => registerWordToDict(w, false)));

  const repairedSets: WordSet[] = [];
  const modifiedSets: WordSet[] = [];

  for (const set of sets) {
    if (!set || !Array.isArray(set.words)) {
      repairedSets.push(set);
      continue;
    }

    if (PRESET_SET_IDS.has(set.id)) {
      const preset = PRESET_SETS.find((p) => p.id === set.id);
      if (preset && (!set.words.length || set.words.some((w) => !w.exampleSentence))) {
        repairedSets.push(preset);
        modifiedSets.push(preset);
        continue;
      }
    }

    let setModified = false;
    const repairedWords = set.words.map((w) => {
      if (!w || typeof w !== 'object') return w;
      const word = { ...w };
      let wordModified = false;
      const normTerm = (word.term || '').trim().toLowerCase();

      // Tier 1: Shifted phonetic recovery
      if ((!word.exampleSentence || !word.exampleSentence.trim()) && word.phonetic) {
        const p = word.phonetic.trim();
        const isPhoneticWrapped = /^\/.*\/$/.test(p) || /^\[.*\]$/.test(p);
        if (/\s/.test(p) && !isPhoneticWrapped) {
          word.exampleSentence = wrapTermInSentence(p, word.term);
          delete word.phonetic;
          wordModified = true;
        }
      }

      // Tier 2: Cross-Set Dictionary Recovery
      if (normTerm && dictionary.has(normTerm)) {
        const ref = dictionary.get(normTerm)!;
        if ((!word.exampleSentence || !word.exampleSentence.trim()) && ref.exampleSentence) {
          word.exampleSentence = wrapTermInSentence(ref.exampleSentence, word.term);
          wordModified = true;
        }
        if ((!word.exampleTranslation || !word.exampleTranslation.trim()) && ref.exampleTranslation) {
          word.exampleTranslation = ref.exampleTranslation;
          wordModified = true;
        }
        if ((!word.phonetic || !word.phonetic.trim()) && ref.phonetic) {
          word.phonetic = ref.phonetic;
          wordModified = true;
        }
      }

      // Tier 3: Smart Flashcard Sentence Fallback
      if (!word.exampleSentence || !word.exampleSentence.trim()) {
        const fallback = buildSmartFallbackSentence(word.term, word.definition);
        if (fallback) {
          word.exampleSentence = fallback;
          wordModified = true;
        }
      } else if (!/<#[\s\S]*?#>/.test(word.exampleSentence)) {
        const wrapped = wrapTermInSentence(word.exampleSentence, word.term);
        if (wrapped !== word.exampleSentence) {
          word.exampleSentence = wrapped;
          wordModified = true;
        }
      }

      if (wordModified) {
        setModified = true;
      }
      return word;
    });

    const repairedSet: WordSet = setModified ? { ...set, words: repairedWords } : set;
    repairedSets.push(repairedSet);
    if (setModified) {
      modifiedSets.push(repairedSet);
    }
  }

  return { repairedSets, modifiedSets };
}

export function recoverAndRepairSingleSet(
  set: WordSet,
  referenceSets: WordSet[] = PRESET_SETS
): { repairedSet: WordSet; modified: boolean } {
  if (PRESET_SET_IDS.has(set.id)) {
    const preset = PRESET_SETS.find((p) => p.id === set.id);
    if (preset) {
      const isDegraded = !set.words?.length || set.words.some((w) => !w.exampleSentence);
      return { repairedSet: preset, modified: isDegraded };
    }
  }

  const result = recoverAndRepairWordSets([set, ...referenceSets]);
  const repaired = result.repairedSets.find((s) => s.id === set.id) || set;
  const isMod = result.modifiedSets.some((s) => s.id === set.id);
  return { repairedSet: repaired, modified: isMod };
}

const LOCAL_STORAGE_KEY = 'vocagame_custom_sets';
const LOCAL_DELETED_KEY = 'vocagame_deleted_set_ids';

// Purge any huge base64 image/audio cache items stored in localStorage from old versions
purgeLocalStorageCaches();

// Helper to read local sets
function getLocalSets(): WordSet[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WordSet[];
  } catch (e) {
    console.warn('Failed to read from localStorage:', e);
    return [];
  }
}

// Helper to safely save local sets without blowing quota
function setLocalSets(sets: WordSet[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sets));
  } catch (e: any) {
    console.warn('Failed to write sets to localStorage (quota exceeded), attempting cleanup:', e);
    purgeLocalStorageCaches();
    try {
      // Create a lightweight version without giant embedded base64 if any exists
      const lightweightSets = sets.map((s) => ({
        ...s,
        words: s.words.map((w) => ({
          ...w,
          imageUrl: w.imageUrl && w.imageUrl.startsWith('data:image') && w.imageUrl.length > 5000 ? undefined : w.imageUrl,
          audioUrl: w.audioUrl && w.audioUrl.startsWith('data:audio') && w.audioUrl.length > 5000 ? undefined : w.audioUrl,
          viAudioUrl: w.viAudioUrl && w.viAudioUrl.startsWith('data:audio') && w.viAudioUrl.length > 5000 ? undefined : w.viAudioUrl,
        })),
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweightSets));
    } catch (retryErr) {
      console.warn('LocalStorage save failed even after cleanup, relying on IndexedDB and Firestore:', retryErr);
    }
  }
}

// Helper to get list of deleted set IDs
function getDeletedSetIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

// Helper to add deleted set ID
function markSetAsDeleted(id: string) {
  try {
    const deletedSet = getDeletedSetIds();
    deletedSet.add(id);
    localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(Array.from(deletedSet)));
  } catch (e) {
    console.warn('Failed to update deleted sets in localStorage:', e);
  }
}

// Helper to unmark deleted set ID (if recreated or resaved)
function unmarkSetAsDeleted(id: string) {
  try {
    const deletedSet = getDeletedSetIds();
    if (deletedSet.has(id)) {
      deletedSet.delete(id);
      localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(Array.from(deletedSet)));
    }
  } catch (e) {
    console.warn('Failed to remove from deleted sets in localStorage:', e);
  }
}

export const getSets = async (): Promise<WordSet[]> => {
  const deletedSetIds = getDeletedSetIds();
  const setMap = new Map<string, WordSet>();

  // Default Unit sets (available immediately without waiting for network)
  PRESET_SETS.forEach((preset) => {
    if (!deletedSetIds.has(preset.id)) {
      setMap.set(preset.id, preset);
    }
  });

  // 1. Fetch all sets from IndexedDB (fast, persistent, unlimited quota)
  try {
    const idbSets = await idbGetAllSets();
    idbSets.forEach((s) => {
      if (s && s.id && !deletedSetIds.has(s.id)) {
        if (PRESET_SET_IDS.has(s.id)) {
          const canonical = PRESET_SETS.find((p) => p.id === s.id);
          if (canonical) {
            setMap.set(s.id, canonical);
            return;
          }
        }
        setMap.set(s.id, s);
      }
    });
  } catch (idbErr) {
    console.warn('IndexedDB fetch error:', idbErr);
  }

  // 2. Add local storage sets created by the user (only if not deleted)
  const localSets = getLocalSets();
  localSets.forEach((s) => {
    if (s && s.id && !deletedSetIds.has(s.id) && !setMap.has(s.id)) {
      setMap.set(s.id, s);
    }
  });

  // 3. Fetch all sets from Firestore (with 1s timeout to keep UI snappy)
  try {
    const fsPromise = getDocs(collection(db, 'wordSets'));
    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 1000));
    const querySnapshot = await Promise.race([fsPromise, timeoutPromise]);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as WordSet;
      if (data && data.id && Array.isArray(data.words) && !deletedSetIds.has(data.id)) {
        if (PRESET_SET_IDS.has(data.id)) {
          const canonical = PRESET_SETS.find((p) => p.id === data.id);
          if (canonical) {
            setMap.set(data.id, canonical);
            return;
          }
        }
        setMap.set(data.id, data);
        // Also cache to IndexedDB for offline fast access
        idbSaveSet(data).catch(() => {});
      }
    });
  } catch (error) {
    console.warn('Firestore fetch failed (offline or guest mode), using local sets:', error);
  }

  // Convert map to array
  const allSets = Array.from(setMap.values());

  // [FEATURE-MAP: ID-05] Automated 3-tier sentence recovery across all flashcard decks
  const { repairedSets, modifiedSets } = recoverAndRepairWordSets(allSets);

  // Background persistence of repaired sets to IndexedDB, localStorage, and Firestore
  if (modifiedSets.length > 0) {
    modifiedSets.forEach((s) => {
      saveSet(s).catch((err) => console.warn(`[storage] Background repair sync failed for set ${s.id}:`, err));
    });
  }

  return repairedSets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

export const getSetById = async (id: string): Promise<WordSet | undefined> => {
  const deletedSetIds = getDeletedSetIds();
  if (deletedSetIds.has(id)) return undefined;

  // Preset fast-path check
  if (PRESET_SET_IDS.has(id)) {
    const canonical = PRESET_SETS.find((p) => p.id === id);
    if (canonical) return canonical;
  }

  let foundSet: WordSet | undefined = undefined;

  // 1. Try IndexedDB first
  try {
    const idbSet = await idbGetSet(id);
    if (idbSet && !deletedSetIds.has(idbSet.id)) {
      foundSet = idbSet;
    }
  } catch (e) {
    console.warn('IndexedDB getSetById failed:', e);
  }

  // 2. Try local storage
  if (!foundSet) {
    const localSets = getLocalSets();
    const localMatch = localSets.find((s) => s.id === id);
    if (localMatch) foundSet = localMatch;
  }

  // 3. Try Firestore
  if (!foundSet) {
    try {
      const docRef = doc(db, 'wordSets', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as WordSet;
        idbSaveSet(data).catch(() => {});
        foundSet = data;
      }
    } catch (error) {
      console.warn(`Firestore getSetById failed for id ${id}:`, error);
    }
  }

  if (!foundSet) return undefined;

  // [FEATURE-MAP: ID-05] Repair single set using PRESET_SETS and local sets as dictionary reference
  const localRefSets = getLocalSets();
  const { repairedSet, modified } = recoverAndRepairSingleSet(foundSet, [...PRESET_SETS, ...localRefSets]);
  if (modified) {
    saveSet(repairedSet).catch((err) => console.warn(`[storage] Background repair sync failed for set ${repairedSet.id}:`, err));
  }

  return repairedSet;
};

export const saveSet = async (set: WordSet) => {
  // Unmark as deleted if it was previously deleted
  unmarkSetAsDeleted(set.id);

  // 1. Save to high-capacity IndexedDB
  await idbSaveSet(set);

  // 2. Try saving to localStorage safely
  const currentLocal = getLocalSets();
  const existingIdx = currentLocal.findIndex((s) => s.id === set.id);
  let updatedLocal: WordSet[];
  if (existingIdx !== -1) {
    updatedLocal = [...currentLocal];
    updatedLocal[existingIdx] = set;
  } else {
    updatedLocal = [set, ...currentLocal];
  }
  setLocalSets(updatedLocal);

  // 3. Also sync to Firestore with clean payload (no undefined values)
  try {
    const docRef = doc(db, 'wordSets', set.id);
    const rawPayload = {
      id: set.id,
      title: set.title || 'Untitled Set',
      description: set.description || '',
      words: set.words.map((w) => ({
        id: w.id,
        term: w.term || '',
        definition: w.definition || '',
        ...(w.phonetic ? { phonetic: w.phonetic } : {}),
        ...(w.imageUrl ? { imageUrl: w.imageUrl } : {}),
        ...(w.audioUrl ? { audioUrl: w.audioUrl } : {}),
        ...(w.viAudioUrl ? { viAudioUrl: w.viAudioUrl } : {}),
        ...(w.exampleSentence ? { exampleSentence: w.exampleSentence } : {}),
        ...(w.exampleTranslation ? { exampleTranslation: w.exampleTranslation } : {}),
      })),
      createdAt: typeof set.createdAt === 'number' ? set.createdAt : Date.now(),
      userId: set.userId || auth.currentUser?.uid || 'guest',
    };
    const cleanPayload = JSON.parse(JSON.stringify(rawPayload));
    await setDoc(docRef, cleanPayload);
    console.log(`[Firestore] Successfully synced set ${set.id} to cloud!`);
  } catch (error) {
    console.error('Firestore saveSet sync error:', error);
  }
};

export const deleteSet = async (id: string) => {
  // 1. Mark as deleted so it won't be resurrected
  markSetAsDeleted(id);

  // 2. Remove from IndexedDB
  await idbDeleteSet(id);

  // 3. Remove from localStorage
  const currentLocal = getLocalSets();
  const filtered = currentLocal.filter((s) => s.id !== id);
  setLocalSets(filtered);

  // 4. Also remove from Firestore
  try {
    const docRef = doc(db, 'wordSets', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firestore deleteSet failed:', error);
  }
};

export const saveAudioFile = async (base64Data: string): Promise<string> => {
  const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2, 9);

  // Save to IndexedDB (unlimited capacity)
  await idbSaveAudio(id, base64Data);

  // Also save to Firestore if connected
  try {
    const docRef = doc(db, 'audioFiles', id);
    await setDoc(docRef, {
      id,
      data: base64Data,
      userId: auth.currentUser?.uid || 'guest',
    });
  } catch (error) {
    console.warn('Firestore saveAudioFile failed, stored in IndexedDB:', error);
  }

  return `firestore://audioFiles/${id}`;
};

export const getAudioFile = async (id: string): Promise<string | null> => {
  // 1. Check IndexedDB first
  try {
    const idbCached = await idbGetAudio(id);
    if (idbCached) return idbCached;
  } catch (e) {
    console.warn('IndexedDB getAudio error:', e);
  }

  // 2. Fallback to Firestore
  try {
    const docRef = doc(db, 'audioFiles', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data().data as string;
      // Cache back into IndexedDB
      idbSaveAudio(id, data).catch(() => {});
      return data;
    }
  } catch (error) {
    console.warn(`Firestore getAudioFile failed for ${id}:`, error);
  }

  return null;
};

export const saveImageFile = async (base64Data: string): Promise<string> => {
  const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substring(2, 9);

  // Save to IndexedDB (unlimited capacity)
  await idbSaveImage(id, base64Data);

  // Also save to Firestore if connected
  try {
    const docRef = doc(db, 'imageFiles', id);
    await setDoc(docRef, {
      id,
      data: base64Data,
      userId: auth.currentUser?.uid || 'guest',
    });
  } catch (error) {
    console.warn('Firestore saveImageFile failed, stored in IndexedDB:', error);
  }

  return `firestore://imageFiles/${id}`;
};

export const getImageFile = async (id: string): Promise<string | null> => {
  if (L3_U7_IMAGES[id]) {
    return L3_U7_IMAGES[id];
  }
  if (L3_U5_IMAGES[id]) {
    return L3_U5_IMAGES[id];
  }
  if (L3_U6_IMAGES[id]) {
    return L3_U6_IMAGES[id];
  }
  // 1. Check IndexedDB first
  try {
    const idbCached = await idbGetImage(id);
    if (idbCached) return idbCached;
  } catch (e) {
    console.warn('IndexedDB getImage error:', e);
  }

  // 2. Fallback to Firestore
  try {
    const docRef = doc(db, 'imageFiles', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data().data as string;
      // Cache back into IndexedDB
      idbSaveImage(id, data).catch(() => {});
      return data;
    }
  } catch (error) {
    console.warn(`Firestore getImageFile failed for ${id}:`, error);
  }

  return null;
};

// ==========================================
// WORKSHEET GENERATOR DRAFT LOCAL STORAGE
// ==========================================

export const WORKSHEET_DRAFT_STORAGE_KEY = 'vocagame_worksheet_draft';

export interface WorksheetDraftState {
  version: 1;
  savedAt: number;
  worksheetMode: 'single' | 'composite';
  title: string;
  sourceMode?: 'library' | 'link' | 'custom' | 'excel';
  selectedSetId?: string | null;
  paperSize?: 'a5' | 'a4';
  fontFamily?: 'r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial' | 'KG Primary Dots';
  fontSize?: number;
  spacing?: number;
  imageSize?: number;
  background?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showImageBorder?: boolean;
  showTableGrid?: boolean;
  words: any[];
  compositeSections: any[];
  activeSectionTab?: number;
  worksheetType?: number;
}

let memoryDraftFallback: string | null = null;

function getSafeLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
  } catch {
    // Access denied or private mode
  }
  return null;
}

/**
 * Saves current worksheet editor state into LocalStorage.
 * Strips heavy base64 (> 5KB) from word image/audio URLs to guarantee zero quota overflows.
 */
export function saveWorksheetDraft(draft: WorksheetDraftState): void {
  try {
    const sanitizedWords = Array.isArray(draft.words)
      ? draft.words.map((w) => {
          if (!w || typeof w !== 'object') return w;
          const cloned = { ...w };
          if (cloned.imageUrl && cloned.imageUrl.startsWith('data:image') && cloned.imageUrl.length > 5000) {
            delete cloned.imageUrl;
          }
          if (cloned.audioUrl && cloned.audioUrl.startsWith('data:audio') && cloned.audioUrl.length > 5000) {
            delete cloned.audioUrl;
          }
          if (cloned.viAudioUrl && cloned.viAudioUrl.startsWith('data:audio') && cloned.viAudioUrl.length > 5000) {
            delete cloned.viAudioUrl;
          }
          return cloned;
        })
      : [];

    const payload: WorksheetDraftState = {
      ...draft,
      version: 1,
      savedAt: Date.now(),
      words: sanitizedWords
    };

    const json = JSON.stringify(payload);
    const storage = getSafeLocalStorage();
    if (storage) {
      try {
        storage.setItem(WORKSHEET_DRAFT_STORAGE_KEY, json);
      } catch (quotaErr) {
        console.warn('[storage] LocalStorage saveWorksheetDraft quota warning, attempting cleanup:', quotaErr);
        purgeLocalStorageCaches();
        try {
          storage.setItem(WORKSHEET_DRAFT_STORAGE_KEY, json);
        } catch (retryErr) {
          console.warn('[storage] LocalStorage retry failed:', retryErr);
        }
      }
    }
    memoryDraftFallback = json;
  } catch (err) {
    console.error('[storage] Failed to save worksheet draft:', err);
  }
}

/**
 * Retrieves saved worksheet draft state from LocalStorage.
 */
export function getWorksheetDraft(): WorksheetDraftState | null {
  let raw: string | null = null;
  const storage = getSafeLocalStorage();
  if (storage) {
    try {
      raw = storage.getItem(WORKSHEET_DRAFT_STORAGE_KEY);
    } catch (err) {
      console.warn('[storage] Failed to read draft from localStorage:', err);
    }
  }
  if (!raw) {
    raw = memoryDraftFallback;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.words) && Array.isArray(parsed.compositeSections)) {
      return parsed as WorksheetDraftState;
    }
  } catch (err) {
    console.warn('[storage] Corrupted worksheet draft JSON in localStorage:', err);
  }
  return null;
}

/**
 * Clears saved worksheet draft from LocalStorage.
 */
export function clearWorksheetDraft(): void {
  const storage = getSafeLocalStorage();
  if (storage) {
    try {
      storage.removeItem(WORKSHEET_DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  memoryDraftFallback = null;
}

