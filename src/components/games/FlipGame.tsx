import SmartImage from "../ui/SmartImage";
import React, { useState, useEffect } from 'react';
import { Word } from '../../types';
import { shuffleArray, cn } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { motion } from 'motion/react';
import { fireConfetti } from '../../utils/confetti';
import { RefreshCw, Trophy, ArrowLeft } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface FlipGameProps {
  words: Word[];
  onExit: () => void;
}

interface Card {
  uniqueId: string; // Unique ID for the card instance
  wordId: string;   // ID of the word (to check matches)
  content: string;
  type: 'term' | 'def';
  isFlipped: boolean;
  isMatched: boolean;
  imageUrl?: string;
  audioUrl?: string;
  viAudioUrl?: string;
}

export default function FlipGame({ words, onExit }: FlipGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<Card[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [moves, setMoves] = useState(0);
  const { speakEn, speakVn } = useSettings();

  useEffect(() => {
    startNewGame();
  }, [words]);

  const startNewGame = () => {
    // Limit to 6 pairs (12 cards) for a balanced grid
    const gameWords = shuffleArray(words).slice(0, 6);
    
    const newCards: Card[] = [];
    gameWords.forEach((w) => {
      newCards.push({ 
        uniqueId: w.id + '-term', 
        wordId: w.id, 
        content: w.term, 
        type: 'term', 
        isFlipped: false, 
        isMatched: false,
        imageUrl: w.imageUrl,
        audioUrl: w.audioUrl
      });
      newCards.push({ 
        uniqueId: w.id + '-def', 
        wordId: w.id, 
        content: w.definition, 
        type: 'def', 
        isFlipped: false, 
        isMatched: false,
        viAudioUrl: w.viAudioUrl
      });
    });

    setCards(shuffleArray(newCards));
    setFlippedCards([]);
    setMoves(0);
    setIsProcessing(false);
  };

  const handleCardClick = (clickedCard: Card) => {
    if (isProcessing || clickedCard.isFlipped || clickedCard.isMatched) return;

    if (clickedCard.type === 'term') {
      speakEn(clickedCard.content, clickedCard.audioUrl);
    } else {
      speakVn(clickedCard.content, clickedCard.viAudioUrl);
    }

    // Flip the card
    const updatedCards = cards.map(c => 
      c.uniqueId === clickedCard.uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);
    
    const newFlipped = [...flippedCards, clickedCard];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsProcessing(true);
      
      const [first, second] = newFlipped;
      
      if (first.wordId === second.wordId) {
        // Match found
        playSound('correct');
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.uniqueId === first.uniqueId || c.uniqueId === second.uniqueId) 
              ? { ...c, isMatched: true, isFlipped: true } 
              : c
          ));
          setFlippedCards([]);
          setIsProcessing(false);

          // Check win condition
          const allMatched = updatedCards.every(c => 
            c.isMatched || c.uniqueId === first.uniqueId || c.uniqueId === second.uniqueId
          );
          
          if (allMatched) {
             fireConfetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
              });
          }
        }, 500);
      } else {
        // No match
        playSound('incorrect');
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.uniqueId === first.uniqueId || c.uniqueId === second.uniqueId) 
              ? { ...c, isFlipped: false } 
              : c
          ));
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1000);
      }
    }
  };

  const isComplete = cards.length > 0 && cards.every(c => c.isMatched);

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-violet-100 rounded-full flex items-center justify-center mb-6 text-violet-500"
        >
          <Trophy className="w-12 h-12" />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Memory Master!</h2>
        <p className="text-xl text-slate-600 mb-8">
          You found all pairs in <span className="font-bold text-indigo-600">{moves}</span> moves.
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
        <h2 className="text-xl font-bold text-slate-900">Find the pairs</h2>
        <div className="text-sm font-medium text-slate-500">
          Moves: {moves}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 auto-rows-fr max-w-3xl mx-auto w-full">
        {cards.map((card) => (
          <div 
            key={card.uniqueId} 
            className="relative perspective-1000 cursor-pointer h-24 md:h-32" 
            onClick={() => handleCardClick(card)}
          >
            <motion.div
              className="w-full h-full relative preserve-3d transition-all duration-500"
              animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
              initial={{ rotateY: 0 }}
            >
              {/* Front of card (Face down state - visible when rotateY is 0) */}
              <div className="absolute inset-0 backface-hidden bg-indigo-500 rounded-xl shadow-md border-b-4 border-indigo-700 flex items-center justify-center z-10">
                <div className="w-8 h-8 rounded-full bg-white/20" />
              </div>

              {/* Back of card (Face up state - visible when rotateY is 180) */}
              <div 
                className={cn(
                  "absolute inset-0 backface-hidden rounded-xl shadow-md flex flex-col items-center justify-center p-2 text-center font-bold text-sm md:text-base select-none border-2 rotate-y-180 overflow-hidden",
                  card.isMatched 
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                    : "bg-white border-indigo-500 text-slate-800"
                )}
              >
                {card.imageUrl && (
                  <div className="w-full h-12 md:h-16 mb-1 flex items-center justify-center">
                    <SmartImage 
                      src={card.imageUrl} 
                      alt={card.content} 
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                )}
                <span className={card.imageUrl ? "text-xs md:text-sm line-clamp-1" : "line-clamp-3"}>
                  {card.content}
                </span>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
