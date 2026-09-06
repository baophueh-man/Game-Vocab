import { collection, doc, setDoc, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { WordSet } from '../types';
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

  // 1. Fetch all sets from IndexedDB (fast, persistent, unlimited quota)
  try {
    const idbSets = await idbGetAllSets();
    idbSets.forEach((s) => {
      if (s && s.id && !deletedSetIds.has(s.id)) {
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

  // 3. Fetch all sets from Firestore
  try {
    const querySnapshot = await getDocs(collection(db, 'wordSets'));
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as WordSet;
      if (data && data.id && Array.isArray(data.words) && !deletedSetIds.has(data.id)) {
        setMap.set(data.id, data);
        // Also cache to IndexedDB for offline fast access
        idbSaveSet(data).catch(() => {});
      }
    });
  } catch (error) {
    console.warn('Firestore fetch failed (offline or guest mode), using local sets:', error);
  }

  // Convert map to array and sort by createdAt descending
  const allSets = Array.from(setMap.values());
  return allSets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

export const getSetById = async (id: string): Promise<WordSet | undefined> => {
  const deletedSetIds = getDeletedSetIds();
  if (deletedSetIds.has(id)) return undefined;

  // 1. Try IndexedDB first
  try {
    const idbSet = await idbGetSet(id);
    if (idbSet && !deletedSetIds.has(idbSet.id)) {
      return idbSet;
    }
  } catch (e) {
    console.warn('IndexedDB getSetById failed:', e);
  }

  // 2. Try local storage
  const localSets = getLocalSets();
  const localMatch = localSets.find((s) => s.id === id);
  if (localMatch) return localMatch;

  // 3. Try Firestore
  try {
    const docRef = doc(db, 'wordSets', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as WordSet;
      // Cache to IndexedDB
      idbSaveSet(data).catch(() => {});
      return data;
    }
  } catch (error) {
    console.warn(`Firestore getSetById failed for id ${id}:`, error);
  }

  return undefined;
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
        ...(w.imageUrl ? { imageUrl: w.imageUrl } : {}),
        ...(w.audioUrl ? { audioUrl: w.audioUrl } : {}),
        ...(w.viAudioUrl ? { viAudioUrl: w.viAudioUrl } : {}),
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

