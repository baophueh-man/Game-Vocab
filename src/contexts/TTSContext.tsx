import React, { createContext, useContext } from 'react';
import { useSettings } from './SettingsContext';

interface TTSContextType {
  voices: SpeechSynthesisVoice[];
  selectedEnVoice: string;
  setSelectedEnVoice: (voiceName: string) => void;
  selectedViVoice: string;
  setSelectedViVoice: (voiceName: string) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  speak: (text: string, lang: 'en' | 'vi') => void;
  cancel: () => void;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export function TTSProvider({ children }: { children: React.ReactNode }) {
  const { 
    enVoices, vnVoices, 
    enVoice, setEnVoice, 
    vnVoice, setVnVoice, 
    speechRate, setSpeechRate, 
    speakEn, speakVn, cancelSpeech 
  } = useSettings();

  const speak = (text: string, lang: 'en' | 'vi') => {
    if (lang === 'en') {
      speakEn(text);
    } else {
      speakVn(text);
    }
  };

  return (
    <TTSContext.Provider value={{
      voices: [...enVoices, ...vnVoices],
      selectedEnVoice: enVoice,
      setSelectedEnVoice: setEnVoice,
      selectedViVoice: vnVoice,
      setSelectedViVoice: setVnVoice,
      speechRate,
      setSpeechRate,
      speak,
      cancel: cancelSpeech
    }}>
      {children}
    </TTSContext.Provider>
  );
}

export function useTTS() {
  const settings = useSettings();
  return {
    voices: [...settings.enVoices, ...settings.vnVoices],
    selectedEnVoice: settings.enVoice,
    setSelectedEnVoice: settings.setEnVoice,
    selectedViVoice: settings.vnVoice,
    setSelectedViVoice: settings.setVnVoice,
    speechRate: settings.speechRate,
    setSpeechRate: settings.setSpeechRate,
    speak: (text: string, lang: 'en' | 'vi') => lang === 'en' ? settings.speakEn(text) : settings.speakVn(text),
    cancel: settings.cancelSpeech
  };
}
