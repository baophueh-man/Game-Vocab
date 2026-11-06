/**
 * Worksheet Type 19: Characters Data & Metadata
 * 8 Standard Textbook Characters from Flashcard Unit 2 (NHANVAT):
 * Ben, Bill, Linh, Lucy, Mai, Mary, Minh, Nam
 */

import { CHARACTERS_BASE64 } from './worksheetCharactersBase64';

export interface TextbookCharacter {
  id: string;
  name: string;
  avatarUrl: string;
  imageBase64?: string;
  gender: 'boy' | 'girl';
}

const rawBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.BASE_URL) || '/';
const cleanBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export const TEXTBOOK_CHARACTERS: TextbookCharacter[] = [
  { id: 'ben', name: 'Ben', avatarUrl: `${cleanBase}/worksheet/characters/Ben.png`, imageBase64: CHARACTERS_BASE64['ben'], gender: 'boy' },
  { id: 'bill', name: 'Bill', avatarUrl: `${cleanBase}/worksheet/characters/Bill.png`, imageBase64: CHARACTERS_BASE64['bill'], gender: 'boy' },
  { id: 'linh', name: 'Linh', avatarUrl: `${cleanBase}/worksheet/characters/Linh.png`, imageBase64: CHARACTERS_BASE64['linh'], gender: 'girl' },
  { id: 'lucy', name: 'Lucy', avatarUrl: `${cleanBase}/worksheet/characters/Lucy.png`, imageBase64: CHARACTERS_BASE64['lucy'], gender: 'girl' },
  { id: 'mai', name: 'Mai', avatarUrl: `${cleanBase}/worksheet/characters/Mai.png`, imageBase64: CHARACTERS_BASE64['mai'], gender: 'girl' },
  { id: 'mary', name: 'Mary', avatarUrl: `${cleanBase}/worksheet/characters/Mary.png`, imageBase64: CHARACTERS_BASE64['mary'], gender: 'girl' },
  { id: 'minh', name: 'Minh', avatarUrl: `${cleanBase}/worksheet/characters/Minh.png`, imageBase64: CHARACTERS_BASE64['minh'], gender: 'boy' },
  { id: 'nam', name: 'Nam', avatarUrl: `${cleanBase}/worksheet/characters/Nam.png`, imageBase64: CHARACTERS_BASE64['nam'], gender: 'boy' }
];

export const ALL_ENTRANCE_CHARACTERS = [
  { value: 'random', label: '🎲 Ngẫu nhiên', isSpecial: true },
  ...TEXTBOOK_CHARACTERS.map(c => ({
    value: c.id,
    label: `${c.gender === 'boy' ? '👦' : '👧'} ${c.name}`,
    avatarUrl: c.imageBase64 || c.avatarUrl
  })),
  { value: 'boy', label: '🏃 Boy Vector', isSpecial: false },
  { value: 'girl', label: '👧 Girl Vector', isSpecial: false },
  { value: 'runner', label: '⚡ Runner Vector', isSpecial: false },
  { value: 'detective', label: '🕵️ Detective', isSpecial: false }
];

export function getCharacterById(id: string): TextbookCharacter | undefined {
  return TEXTBOOK_CHARACTERS.find(c => c.id.toLowerCase() === id.toLowerCase());
}
