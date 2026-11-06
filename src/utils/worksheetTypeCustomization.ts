/**
 * Worksheet Type Customization Module
 * Manages custom names and descriptions for Worksheet Types 1-18.
 * Features:
 * - Persistent storage via localStorage with robust JSON parsing & error fallback
 * - Event-based real-time synchronization across all UI components
 * - Input sanitization preventing XSS / formatting issues
 * - Granular & bulk reset to system defaults
 * - Dedicated React hook `useWorksheetTypes`
 */

import { useState, useEffect, useCallback } from 'react';
import { WorksheetType, WorksheetTypeMeta, WORKSHEET_TYPES } from './worksheetGenerator';

export const WORKSHEET_TYPES_STORAGE_KEY = 'vocagame_custom_worksheet_types';
export const WORKSHEET_TYPES_UPDATED_EVENT = 'vocagame_worksheet_types_updated';

export interface CustomWorksheetTypeOverride {
  name?: string;
  description?: string;
  updatedAt?: number;
}

export type CustomWorksheetTypesMap = Record<number, CustomWorksheetTypeOverride>;

/**
 * Basic HTML/script tag stripper to prevent XSS while preserving legitimate characters
 */
export function sanitizeCustomText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Deep clones the immutable system defaults for Worksheet Types
 */
export function getDefaultWorksheetTypes(): WorksheetTypeMeta[] {
  return WORKSHEET_TYPES.map((t) => ({ ...t }));
}

/**
 * Reads custom overrides map safely from localStorage
 */
export function getCustomWorksheetTypeOverrides(): CustomWorksheetTypesMap {
  if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') {
    return {};
  }
  try {
    const raw = localStorage.getItem(WORKSHEET_TYPES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const cleanMap: CustomWorksheetTypesMap = {};
    for (const [key, val] of Object.entries(parsed)) {
      const typeNum = Number(key);
      if (isNaN(typeNum) || typeNum < 1 || typeNum > 20) continue;
      if (val && typeof val === 'object') {
        const item = val as CustomWorksheetTypeOverride;
        const cleanName = item.name ? sanitizeCustomText(item.name) : undefined;
        const cleanDesc = item.description ? sanitizeCustomText(item.description) : undefined;
        if (cleanName !== undefined || cleanDesc !== undefined) {
          cleanMap[typeNum] = {
            name: cleanName,
            description: cleanDesc,
            updatedAt: item.updatedAt || Date.now()
          };
        }
      }
    }
    return cleanMap;
  } catch (err) {
    console.warn('[worksheetTypeCustomization] Failed to parse custom overrides from localStorage:', err);
    return {};
  }
}

/**
 * Emits an event to notify all listening components that worksheet types have changed
 */
export function notifyWorksheetTypesUpdated(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(WORKSHEET_TYPES_UPDATED_EVENT));
  }
}

/**
 * Merges system defaults with saved user overrides
 */
export function getWorksheetTypes(): WorksheetTypeMeta[] {
  const defaults = getDefaultWorksheetTypes();
  const overrides = getCustomWorksheetTypeOverrides();

  return defaults.map((item) => {
    const override = overrides[item.type];
    if (!override) return item;

    return {
      ...item,
      name: override.name && override.name.trim() !== '' ? override.name : item.name,
      description: override.description !== undefined && override.description.trim() !== '' ? override.description : item.description
    };
  });
}

/**
 * Checks if a specific worksheet type has user customizations
 */
export function isWorksheetTypeCustomized(type: number): boolean {
  const overrides = getCustomWorksheetTypeOverrides();
  const override = overrides[type];
  if (!override) return false;
  return Boolean((override.name && override.name.trim() !== '') || (override.description && override.description.trim() !== ''));
}

/**
 * Saves customization for a single worksheet type
 */
export function saveWorksheetTypeCustomization(
  type: WorksheetType | number,
  nameOrObj: string | { name?: string; description?: string },
  description?: string
): void {
  const overrides = getCustomWorksheetTypeOverrides();
  let cleanName: string | undefined;
  let cleanDesc: string | undefined;

  if (typeof nameOrObj === 'object' && nameOrObj !== null) {
    cleanName = nameOrObj.name ? sanitizeCustomText(nameOrObj.name) : undefined;
    cleanDesc = nameOrObj.description ? sanitizeCustomText(nameOrObj.description) : undefined;
  } else {
    cleanName = typeof nameOrObj === 'string' ? sanitizeCustomText(nameOrObj) : undefined;
    cleanDesc = typeof description === 'string' ? sanitizeCustomText(description) : undefined;
  }

  overrides[type] = {
    name: cleanName,
    description: cleanDesc,
    updatedAt: Date.now()
  };

  try {
    localStorage.setItem(WORKSHEET_TYPES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('[worksheetTypeCustomization] Storage write failed:', e);
  }

  notifyWorksheetTypesUpdated();
}

/**
 * Batch saves multiple customizations at once
 */
export function saveAllWorksheetTypeCustomizations(customMap: CustomWorksheetTypesMap): void {
  const overrides = getCustomWorksheetTypeOverrides();

  for (const [key, val] of Object.entries(customMap)) {
    const typeNum = Number(key);
    if (isNaN(typeNum) || typeNum < 1 || typeNum > 20) continue;
    overrides[typeNum] = {
      name: val.name !== undefined ? sanitizeCustomText(val.name) : overrides[typeNum]?.name,
      description: val.description !== undefined ? sanitizeCustomText(val.description) : overrides[typeNum]?.description,
      updatedAt: Date.now()
    };
  }

  try {
    localStorage.setItem(WORKSHEET_TYPES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('[worksheetTypeCustomization] Storage write failed:', e);
  }

  notifyWorksheetTypesUpdated();
}

/**
 * Resets a single worksheet type back to default
 */
export function resetWorksheetTypeCustomization(type: WorksheetType | number): void {
  const overrides = getCustomWorksheetTypeOverrides();
  if (overrides[type]) {
    delete overrides[type];
    try {
      localStorage.setItem(WORKSHEET_TYPES_STORAGE_KEY, JSON.stringify(overrides));
    } catch (e) {
      console.error('[worksheetTypeCustomization] Storage write failed:', e);
    }
    notifyWorksheetTypesUpdated();
  }
}

/**
 * Resets all worksheet types back to system defaults
 */
export function resetAllWorksheetTypeCustomizations(): void {
  try {
    localStorage.removeItem(WORKSHEET_TYPES_STORAGE_KEY);
  } catch (e) {
    console.error('[worksheetTypeCustomization] Storage remove failed:', e);
  }
  notifyWorksheetTypesUpdated();
}

/**
 * React hook to observe and update Worksheet Types in reactive components
 */
export function useWorksheetTypes() {
  const [worksheetTypes, setTypesState] = useState<WorksheetTypeMeta[]>(() => getWorksheetTypes());
  const [overrides, setOverridesState] = useState<CustomWorksheetTypesMap>(() => getCustomWorksheetTypeOverrides());

  const refresh = useCallback(() => {
    setTypesState(getWorksheetTypes());
    setOverridesState(getCustomWorksheetTypeOverrides());
  }, []);

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();

    if (typeof window !== 'undefined') {
      window.addEventListener(WORKSHEET_TYPES_UPDATED_EVENT, handleUpdate);
      window.addEventListener('storage', handleUpdate);
      return () => {
        window.removeEventListener(WORKSHEET_TYPES_UPDATED_EVENT, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      };
    }
  }, [refresh]);

  const updateType = useCallback((type: WorksheetType | number, name: string, description: string) => {
    saveWorksheetTypeCustomization(type, name, description);
    refresh();
  }, [refresh]);

  const updateAll = useCallback((customMap: CustomWorksheetTypesMap) => {
    saveAllWorksheetTypeCustomizations(customMap);
    refresh();
  }, [refresh]);

  const resetType = useCallback((type: WorksheetType | number) => {
    resetWorksheetTypeCustomization(type);
    refresh();
  }, [refresh]);

  const resetAll = useCallback(() => {
    resetAllWorksheetTypeCustomizations();
    refresh();
  }, [refresh]);

  const isCustomized = useCallback((type: number) => {
    return isWorksheetTypeCustomized(type);
  }, []);

  return {
    worksheetTypes,
    overrides,
    updateType,
    updateAll,
    resetType,
    resetAll,
    isCustomized,
    refresh
  };
}
