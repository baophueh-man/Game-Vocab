export interface Word {
  id: string;
  term: string; // English
  definition: string; // Vietnamese
  phonetic?: string; // Optional IPA phonetic: /ˈæpəl/
  imageUrl?: string; // Optional image URL
  audioUrl?: string; // Optional audio URL
  viAudioUrl?: string; // Optional Vietnamese audio URL
  exampleSentence?: string; // Optional example sentence with <#highlighted term/phrase#>
  exampleTranslation?: string; // Optional Vietnamese translation of example sentence
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
