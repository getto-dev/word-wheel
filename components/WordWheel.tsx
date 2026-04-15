/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import useAudio from "../hooks/useAudio";
import { getPath } from "../utils/path";

interface WordWheelProps {
  letters: string;
  onWordSubmit: (word: string) => void;
  onCurrentWordChange: (word: string) => void;
  onInteraction?: () => void;
}

const WordWheel: React.FC<WordWheelProps> = ({ letters, onWordSubmit, onCurrentWordChange, onInteraction }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const radius = 35;
  const { playForeground } = useAudio();

  const letterArray = useMemo(() => letters.split(""), [letters]);

  const [shuffledIndices, setShuffledIndices] = useState<number[]>(() =>
    Array.from({ length: letters.length }, (_, i) => i).sort(() => Math.random() - 0.5)
  );

  const handleShuffle = () => {
    setShuffledIndices(prev => [...prev].sort(() => Math.random() - 0.5));
    playForeground(getPath("/media/audio/sfx/wordwheel/letterselect.mp3"));
  };

  const getLetterPosNormalized = useCallback(
    (indexInShuffled: number) => {
      const angle = (indexInShuffled / letterArray.length) * 2 * Math.PI - Math.PI / 2;
      return {
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
      };
    },
    [letterArray.length, radius]
  );

  const findIndexAtPos = (clientX: number, clientY: number) => {
    if (!containerRef.current) return -1;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const threshold = 14;

    for (let i = 0; i < shuffledIndices.length; i++) {
      const pos = getLetterPosNormalized(i);
      const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
      if (dist < threshold) return shuffledIndices[i];
    }
    return -1;
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX =
      "touches" in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    const index = findIndexAtPos(clientX, clientY);
    if (index !== -1) {
      onInteraction?.();
      setIsDragging(true);
      setSelectedIndices([index]);
      playForeground(getPath("/media/audio/sfx/wordwheel/letterselect.mp3"));
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePos({
          x: ((clientX - rect.left) / rect.width) * 100,
          y: ((clientY - rect.top) / rect.height) * 100,
        });
      }
      onCurrentWordChange(letterArray[index]);
    }
  };

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const rect = containerRef.current.getBoundingClientRect();

      const xPct = ((clientX - rect.left) / rect.width) * 100;
      const yPct = ((clientY - rect.top) / rect.height) * 100;
      setMousePos({ x: xPct, y: yPct });

      const index = findIndexAtPos(clientX, clientY);
      if (index !== -1 && !selectedIndices.includes(index)) {
        const next = [...selectedIndices, index];
        playForeground(getPath("/media/audio/sfx/wordwheel/letterselect.mp3"));
        onCurrentWordChange(next.map(i => letterArray[i]).join(""));
        setSelectedIndices(next);
      }
    },
    [isDragging, selectedIndices, shuffledIndices, letterArray, onCurrentWordChange]
  );

  const handleEnd = useCallback(() => {
    if (isDragging) {
      const word = selectedIndices.map(i => letterArray[i]).join("");
      if (word.length > 1) onWordSubmit(word);
      setIsDragging(false);
      setSelectedIndices([]);
      onCurrentWordChange("");
    }
  }, [isDragging, selectedIndices, letterArray, onWordSubmit, onCurrentWordChange]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [handleMove, handleEnd]);

  return (
    <div
      key={letters}
      className="relative w-full max-w-[175px] sm:max-w-[200px] md:max-w-[250px] short:lg:max-w-[424px] lg:max-w-[472px] mx-auto select-none touch-none animate-wheel">
      <style>
        {`
          @keyframes wheelPop {
            0% { 
              opacity: 0; 
              transform: scale(0.9); 
            }
            100% { 
              opacity: 1; 
              transform: scale(1); 
            }
          }

          .animate-wheel {
            animation: wheelPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }
        `}
      </style>
      <div
        ref={containerRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart as any}
        className="relative w-full aspect-square rounded-full bg-[#37383B] flex items-center justify-center overflow-visible transition-all"
      >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
        >
          {selectedIndices.length > 0 &&
            selectedIndices.map((idx, i) => {
              const startIdxInShuffled = shuffledIndices.indexOf(idx);
              const startPos = getLetterPosNormalized(startIdxInShuffled);

              if (i === selectedIndices.length - 1) {
                return (
                  <line
                    key="last"
                    x1={startPos.x}
                    y1={startPos.y}
                    x2={mousePos.x}
                    y2={mousePos.y}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="1"
                  />
                );
              }

              const nextIdxInShuffled = shuffledIndices.indexOf(selectedIndices[i + 1]);
              const nextPos = getLetterPosNormalized(nextIdxInShuffled);
              return (
                <line
                  key={i}
                  x1={startPos.x}
                  y1={startPos.y}
                  x2={nextPos.x}
                  y2={nextPos.y}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="1"
                />
              );
            })}
        </svg>

        {shuffledIndices.map((letterIdx, i) => {
          const angle = (i / letterArray.length) * 2 * Math.PI - Math.PI / 2;
          const isSelected = selectedIndices.includes(letterIdx);

          return (
            <div
              key={letterIdx}
              className={`absolute flex items-center justify-center rounded-full transition-opacity duration-150 transform-gpu z-10 w-10 h-10 lg:w-[74px] lg:h-[74px] text-[24px] lg:text-[54px] font-medium
                ${isSelected ? "bg-[#FFFFFF] text-black" : "bg-transparent text-white hover:text-black hover:bg-[#FFFFFF]"}
              `}
              style={{
                left: `calc(50% + ${Math.cos(angle) * radius}%)`,
                top: `calc(50% + ${Math.sin(angle) * radius}%)`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {letterArray[letterIdx]}
            </div>
          );
        })}

        <button
          onClick={e => {
            e.stopPropagation();
            handleShuffle();
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 lg:p-6 aspect-square rounded-full bg-white hover:bg-white/75 transition-all active:scale-90 z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 16" fill="none" className="w-3 h-3 lg:w-6 lg:h-6 text-black">
            <path d="M11.05 16C8.81667 16 6.91667 15.225 5.35 13.675C3.78333 12.125 3 10.2333 3 8V7.825L1.4 9.425L0 8.025L4 4.025L8 8.025L6.6 9.425L5 7.825V8C5 9.66667 5.5875 11.0833 6.7625 12.25C7.9375 13.4167 9.36667 14 11.05 14C11.4833 14 11.9083 13.95 12.325 13.85C12.7417 13.75 13.15 13.6 13.55 13.4L15.05 14.9C14.4167 15.2667 13.7667 15.5417 13.1 15.725C12.4333 15.9083 11.75 16 11.05 16ZM18 11.975L14 7.975L15.4 6.575L17 8.175V8C17 6.33333 16.4125 4.91667 15.2375 3.75C14.0625 2.58333 12.6333 2 10.95 2C10.5167 2 10.0917 2.05 9.675 2.15C9.25833 2.25 8.85 2.4 8.45 2.6L6.95 1.1C7.58333 0.733333 8.23333 0.458333 8.9 0.275C9.56667 0.0916667 10.25 0 10.95 0C13.1833 0 15.0833 0.775 16.65 2.325C18.2167 3.875 19 5.76667 19 8V8.175L20.6 6.575L22 7.975L18 11.975Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WordWheel;
