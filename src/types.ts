export interface Word {
  id: string;
  term: string; // English
  definition: string; // Vietnamese
  imageUrl?: string; // Optional image URL
  audioUrl?: string; // Optional audio URL
  viAudioUrl?: string; // Optional Vietnamese audio URL
}

export interface WordSet {
  id: string;
  title: string;
  description?: string;
  words: Word[];
  createdAt: number;
  userId: string;
}

export type GameType = 'quiz' | 'match' | 'flip' | 'unscramble' | 'matchUp' | 'findMatch' | 'speakingCards' | 'spinWheel' | 'openBox' | 'listenMtq' | 'gauntlet';
export type ThemeType = 'default' | 'summer' | 'classroom' | 'space' | 'jungle' | 'halloween';
