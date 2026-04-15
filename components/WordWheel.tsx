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
  const [wheelSize, setWheelSize] = useState(0);
  const radius = 35;
  const { playForeground } = useAudio();

  const letterArray = useMemo(() => letters.split(""), [letters]);

  const [shuffledIndices, setShuffledIndices] = useState<number[]>(() =>
    Array.from({ length: letters.length }, (_, i) => i).sort(() => Math.random() - 0.5)
  );

  // Track wheel container size for adaptive touch
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setWheelSize(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
    // Threshold: each letter gets ~14% of radius in each direction
    const threshold = Math.max(12, Math.min(18, (100 / letterArray.length) * 0.6));

    let closestIndex = -1;
    let closestDist = Infinity;

    for (let i = 0; i < shuffledIndices.length; i++) {
      const pos = getLetterPosNormalized(i);
      const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
      if (dist < threshold && dist < closestDist) {
        closestDist = dist;
        closestIndex = shuffledIndices[i];
      }
    }
    return closestIndex;
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
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [handleMove, handleEnd]);

  // Dynamic letter circle sizing based on wheel size
  const letterSize = wheelSize >= 400 ? 74 : wheelSize >= 300 ? 56 : wheelSize >= 220 ? 44 : 36;
  const fontSize = wheelSize >= 400 ? 54 : wheelSize >= 300 ? 40 : wheelSize >= 220 ? 30 : 24;
  const shufflePad = wheelSize >= 400 ? 24 : wheelSize >= 300 ? 18 : 14;

  return (
    <div
      key={letters}
      className="relative mx-auto select-none touch-none animate-wheel"
      style={{
        width: 'min(55vw, 220px)',
        maxWidth: '472px',
        aspectRatio: '1',
      }}
    >
      <style>{`
        @keyframes wheelPop {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-wheel {
          animation: wheelPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @media (min-width: 768px) {
          .animate-wheel-wrapper {
            width: min(380px, 47vw);
          }
        }
        @media (min-width: 1024px) {
          .animate-wheel-wrapper {
            width: min(472px, 40vw);
          }
        }
      `}</style>
      <div
        ref={containerRef}
        onMouseDown={handleStart}
        onTouchStart={(e) => { e.preventDefault(); handleStart(e); }}
        className="relative w-full aspect-square rounded-full bg-[#37383B] flex items-center justify-center overflow-visible"
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
                  <line key="last" x1={startPos.x} y1={startPos.y} x2={mousePos.x} y2={mousePos.y}
                    stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="1" />
                );
              }

              const nextIdxInShuffled = shuffledIndices.indexOf(selectedIndices[i + 1]);
              const nextPos = getLetterPosNormalized(nextIdxInShuffled);
              return (
                <line key={i} x1={startPos.x} y1={startPos.y} x2={nextPos.x} y2={nextPos.y}
                  stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="1" />
              );
            })}
        </svg>

        {shuffledIndices.map((letterIdx, i) => {
          const angle = (i / letterArray.length) * 2 * Math.PI - Math.PI / 2;
          const isSelected = selectedIndices.includes(letterIdx);

          return (
            <div
              key={letterIdx}
              className={`absolute flex items-center justify-center rounded-full z-10
                transition-colors duration-100 transform-gpu
                ${isSelected 
                  ? "bg-[#FFFFFF] text-black scale-110" 
                  : "bg-[#2A2B2D] text-white active:bg-[#FFFFFF] active:text-black"
                }`}
              style={{
                left: `calc(50% + ${Math.cos(angle) * radius}%)`,
                top: `calc(50% + ${Math.sin(angle) * radius}%)`,
                transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.1)' : 'scale(1)'}`,
                width: `${letterSize}px`,
                height: `${letterSize}px`,
                fontSize: `${fontSize}px`,
              }}
            >
              {letterArray[letterIdx]}
            </div>
          );
        })}

        <button
          onClick={e => { e.stopPropagation(); handleShuffle(); }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
            rounded-full bg-white active:bg-white/80 transition-transform active:scale-90 z-20
            flex items-center justify-center"
          style={{
            width: `${shufflePad * 2.2}px`,
            height: `${shufflePad * 2.2}px`,
          }}
          aria-label="Перемешать буквы"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 16" fill="none" 
            className="text-black" style={{ width: `${shufflePad * 0.8}px`, height: `${shufflePad * 0.8}px` }}>
            <path d="M11.05 16C8.81667 16 6.91667 15.225 5.35 13.675C3.78333 12.125 3 10.2333 3 8V7.825L1.4 9.425L0 8.025L4 4.025L8 8.025L6.6 9.425L5 7.825V8C5 9.66667 5.5875 11.0833 6.7625 12.25C7.9375 13.4167 9.36667 14 11.05 14C11.4833 14 11.9083 13.95 12.325 13.85C12.7417 13.75 13.15 13.6 13.55 13.4L15.05 14.9C14.4167 15.2667 13.7667 15.5417 13.1 15.725C12.4333 15.9083 11.75 16 11.05 16ZM18 11.975L14 7.975L15.4 6.575L17 8.175V8C17 6.33333 16.4125 4.91667 15.2375 3.75C14.0625 2.58333 12.6333 2 10.95 2C10.5167 2 10.0917 2.05 9.675 2.15C9.25833 2.25 8.85 2.4 8.45 2.6L6.95 1.1C7.58333 0.733333 8.23333 0.458333 8.9 0.275C9.56667 0.0916667 10.25 0 10.95 0C13.1833 0 15.0833 0.775 16.65 2.325C18.2167 3.875 19 5.76667 19 8V8.175L20.6 6.575L22 7.975L18 11.975Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WordWheel;
