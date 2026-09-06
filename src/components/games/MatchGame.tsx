import SmartImage from "../ui/SmartImage";
import React, { useState, useEffect } from 'react';
import { Word } from '../../types';
import { shuffleArray, cn } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { fireConfetti } from '../../utils/confetti';
import { RefreshCw, Trophy } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface MatchGameProps {
  words: Word[];
  onExit: () => void;
}

interface Tile {
  id: string;
  text: string;
  type: 'term' | 'def';
  matchId: string;
  status: 'idle' | 'selected' | 'matched' | 'wrong';
  imageUrl?: string;
  audioUrl?: string;
  viAudioUrl?: string;
}

export default function MatchGame({ words, onExit }: MatchGameProps) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchesFound, setMatchesFound] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const { speakEn, speakVn, cancelSpeech } = useSettings();

  useEffect(() => {
    startNewGame();
    return () => cancelSpeech();
  }, [words]);

  const startNewGame = () => {
    // Take up to 8 pairs to fit screen nicely
    const gameWords = shuffleArray(words).slice(0, 8);
    
    const newTiles: Tile[] = [];
    gameWords.forEach((w) => {
      newTiles.push({ id: w.id + '-term', text: w.term, type: 'term', matchId: w.id, status: 'idle', imageUrl: w.imageUrl, audioUrl: w.audioUrl });
      newTiles.push({ id: w.id + '-def', text: w.definition, type: 'def', matchId: w.id, status: 'idle', viAudioUrl: w.viAudioUrl });
    });

    setTiles(shuffleArray(newTiles));
    setSelectedTile(null);
    setMatchesFound(0);
    setAttempts(0);
  };

  const handleTileClick = (tile: Tile) => {
    if (isProcessing || tile.status === 'matched' || tile.status === 'selected') return;

    if (tile.type === 'term') {
      speakEn(tile.text, tile.audioUrl);
    } else {
      speakVn(tile.text, tile.viAudioUrl);
    }

    if (!selectedTile) {
      // First selection
      setTiles(tiles.map(t => t.id === tile.id ? { ...t, status: 'selected' } : t));
      setSelectedTile(tile);
    } else {
      // Second selection
      setAttempts(a => a + 1);
      setTiles(tiles.map(t => t.id === tile.id ? { ...t, status: 'selected' } : t));
      setIsProcessing(true);

      if (selectedTile.matchId === tile.matchId) {
        // Match!
        playSound('correct');
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            (t.id === tile.id || t.id === selectedTile.id) 
              ? { ...t, status: 'matched' } 
              : t
          ));
          setMatchesFound(m => {
            const newM = m + 1;
            if (newM === tiles.length / 2) {
              fireConfetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 }
              });
            }
            return newM;
          });
          setSelectedTile(null);
          setIsProcessing(false);
        }, 500);
      } else {
        // Wrong
        playSound('incorrect');
        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            (t.id === tile.id || t.id === selectedTile.id) 
              ? { ...t, status: 'wrong' } 
              : t
          ));
        }, 300);

        setTimeout(() => {
          setTiles(prev => prev.map(t => 
            (t.id === tile.id || t.id === selectedTile.id) 
              ? { ...t, status: 'idle' } 
              : t
          ));
          setSelectedTile(null);
          setIsProcessing(false);
        }, 1000);
      }
    }
  };

  if (matchesFound === tiles.length / 2 && tiles.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-500"
        >
          <Trophy className="w-12 h-12" />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">All Matched!</h2>
        <p className="text-xl text-slate-600 mb-8">
          You cleared the board in <span className="font-bold text-indigo-600">{attempts}</span> moves.
        </p>
        <div className="flex gap-4">
          <button
            onClick={startNewGame}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Play Again
          </button>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Tap pairs to match</h2>
        <div className="text-sm font-medium text-slate-500">
          Moves: {attempts}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-fr">
        <AnimatePresence>
          {tiles.map((tile) => (
            <motion.button
              key={tile.id}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: tile.status === 'matched' ? 0 : 1, 
                opacity: tile.status === 'matched' ? 0 : 1,
                backgroundColor: 
                  tile.status === 'selected' ? '#e0e7ff' : 
                  tile.status === 'wrong' ? '#fee2e2' : 
                  '#ffffff'
              }}
              onClick={() => handleTileClick(tile)}
              className={cn(
                "rounded-xl border-2 p-4 flex flex-col items-center justify-center text-center font-medium shadow-sm transition-colors relative overflow-hidden",
                tile.status === 'selected' ? "border-indigo-500 text-indigo-700" :
                tile.status === 'wrong' ? "border-red-500 text-red-700" :
                "border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md",
                tile.imageUrl ? "text-base" : "text-lg"
              )}
            >
              {tile.imageUrl && (
                <div className="w-full h-24 mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50">
                  <SmartImage src={tile.imageUrl} alt={tile.text} referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <span className={cn("line-clamp-3", tile.imageUrl && "font-bold")}>{tile.text}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
