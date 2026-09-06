// High-performance, large-capacity IndexedDB storage for VocaGame
// Completely solves localStorage 5MB quota limits for sets, audio, and image assets.

import { WordSet } from '../types';

const DB_NAME = 'VocaGameDB';
const DB_VERSION = 1;

const STORES = {
  SETS: 'sets',
  IMAGES: 'images',
  AUDIO: 'audio',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not available'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.SETS)) {
          db.createObjectStore(STORES.SETS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.IMAGES)) {
          db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.AUDIO)) {
          db.createObjectStore(STORES.AUDIO, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
    });
  }

  return dbPromise;
}

// Clean up old bloated localStorage cache entries left from earlier versions
export function purgeLocalStorageCaches() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('vocagame_image_cache_') || key.startsWith('vocagame_audio_cache_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    if (keysToRemove.length > 0) {
      console.log(`[Storage] Cleared ${keysToRemove.length} legacy asset cache items from localStorage.`);
    }
  } catch (err) {
    console.warn('[Storage] Purge legacy cache error:', err);
  }
}

// --- Sets Store ---
export async function idbSaveSet(set: WordSet): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SETS, 'readwrite');
      const store = tx.objectStore(STORES.SETS);
      const req = store.put(set);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbSaveSet failed:', err);
  }
}

export async function idbGetSet(id: string): Promise<WordSet | undefined> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SETS, 'readonly');
      const store = tx.objectStore(STORES.SETS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as WordSet | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbGetSet failed:', err);
    return undefined;
  }
}

export async function idbGetAllSets(): Promise<WordSet[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SETS, 'readonly');
      const store = tx.objectStore(STORES.SETS);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as WordSet[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbGetAllSets failed:', err);
    return [];
  }
}

export async function idbDeleteSet(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SETS, 'readwrite');
      const store = tx.objectStore(STORES.SETS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbDeleteSet failed:', err);
  }
}

// --- Images Store ---
export async function idbSaveImage(id: string, base64Data: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.IMAGES, 'readwrite');
      const store = tx.objectStore(STORES.IMAGES);
      const req = store.put({ id, data: base64Data, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbSaveImage failed:', err);
  }
}

export async function idbGetImage(id: string): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.IMAGES, 'readonly');
      const store = tx.objectStore(STORES.IMAGES);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? (req.result.data as string) : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbGetImage failed:', err);
    return null;
  }
}

// --- Audio Store ---
export async function idbSaveAudio(id: string, base64Data: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AUDIO, 'readwrite');
      const store = tx.objectStore(STORES.AUDIO);
      const req = store.put({ id, data: base64Data, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbSaveAudio failed:', err);
  }
}

export async function idbGetAudio(id: string): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AUDIO, 'readonly');
      const store = tx.objectStore(STORES.AUDIO);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? (req.result.data as string) : null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('idbGetAudio failed:', err);
    return null;
  }
}
