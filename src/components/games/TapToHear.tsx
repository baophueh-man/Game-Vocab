import SmartImage from "../ui/SmartImage";
import React from 'react';
import { Word } from '../../types';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function TapToHear({ words, onExit }: { words: Word[], onExit: () => void }) {
  const { speakEn } = useSettings();

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-y-auto bg-white/50 backdrop-blur-sm rounded-3xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Tap to Hear</h2>
        <p className="text-slate-600 mt-2">Tap on any picture or word to hear its pronunciation.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full pb-12">
        {words.map((word, index) => (
          <motion.div
            key={word.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => speakEn(word.term, word.audioUrl)}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-md hover:border-indigo-300 hover:scale-105 transition-all group"
          >
            {word.imageUrl ? (
              <div className="w-32 h-32 md:w-40 md:h-40 mb-6 rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 group-hover:bg-indigo-50/50 transition-colors">
                <SmartImage
                  src={word.imageUrl}
                  alt={word.term}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 mb-6 rounded-xl bg-indigo-50 text-indigo-200 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <Volume2 className="w-12 h-12 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            )}
            
            <span className="text-2xl md:text-3xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-center break-words w-full">
              {word.term}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
