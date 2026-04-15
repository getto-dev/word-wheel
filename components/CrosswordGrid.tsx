/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from "react";
import { Puzzle } from "../types";
import { getPath } from "../utils/path";

interface CrosswordGridProps {
  puzzle: Puzzle;
  foundWords: string[];
}

const CrosswordGrid: React.FC<CrosswordGridProps> = ({ puzzle, foundWords }) => {
  const [displayPuzzle, setDisplayPuzzle] = useState(puzzle);
  const [isTransitioning, setIsTransitioning] = useState(false);

  if (puzzle !== displayPuzzle && !isTransitioning) {
      setIsTransitioning(true);
  }

  useEffect(() => {
    if (isTransitioning) {
      // Wait for fade out (300ms), then swap data and fade in
      const timer = setTimeout(() => {
        setDisplayPuzzle(puzzle);
        setIsTransitioning(false);
      }, 300); 

      return () => clearTimeout(timer);
    }
  }, [puzzle, displayPuzzle]);

  const currentPuzzle = displayPuzzle;

  if (!currentPuzzle.words || currentPuzzle.words.length === 0) return null;

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  currentPuzzle.words.forEach(pw => {
    const { word, x, y, direction } = pw;
    for (let i = 0; i < word.length; i++) {
      const curX = direction === "h" ? x + i : x;
      const curY = direction === "v" ? y + i : y;
      minX = Math.min(minX, curX);
      maxX = Math.max(maxX, curX);
      minY = Math.min(minY, curY);
      maxY = Math.max(maxY, curY);
    }
  });

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  const grid: (string | null)[][] = Array.from({ length: height }, () => Array(width).fill(null));
  const masks: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

  currentPuzzle.words.forEach(pw => {
    const { word, x, y, direction } = pw;
    for (let i = 0; i < word.length; i++) {
      const curX = (direction === "h" ? x + i : x) - minX;
      const curY = (direction === "v" ? y + i : y) - minY;
      if (curX >= 0 && curX < width && curY >= 0 && curY < height) {
        grid[curY][curX] = word[i];
        masks[curY][curX] = true;
      }
    }
  });

  const isRevealed = (relX: number, relY: number) => {
    const absoluteX = relX + minX;
    const absoluteY = relY + minY;
    return currentPuzzle.words.some(pw => {
      if (!foundWords.includes(pw.word)) return false;
      const { word, x, y, direction } = pw;
      for (let i = 0; i < word.length; i++) {
        const curX = direction === "h" ? x + i : x;
        const curY = direction === "v" ? y + i : y;
        if (curX === absoluteX && curY === absoluteY) return true;
      }
      return false;
    });
  };

  return (
    <div key={`${currentPuzzle.letters}-${currentPuzzle.difficulty}`} className="flex justify-center items-center max-w-full max-h-full min-w-0 min-h-0 short:lg:mt-0 lg:mt-[78px]">
      <style>{`
        @keyframes cellFadeIn {
          from { 
            opacity: 0; 
            transform: scale(0.8); 
          }
          to { 
            opacity: 1; 
            transform: scale(1); 
          }
        }
        .animate-cell-in {
          opacity: 0;
          animation: cellFadeIn 0.4s ease-out forwards;
        }
      `}</style>
      <div
        key={JSON.stringify(`${currentPuzzle.letters}-${currentPuzzle.difficulty}`)}
        className={`grid gap-1 lg:gap-2 p-[8px] max-w-full max-h-full justify-center items-center [--cell-size:32px] md:[--cell-size:48px] short:lg:[--cell-size:48px] lg:[--cell-size:64px] ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        style={{
          gridTemplateColumns: `repeat(${width}, var(--cell-size))`,
          gridTemplateRows: `repeat(${height}, var(--cell-size))`,
          width: "fit-content",
        }}
      >
        {grid.map((row, y) =>
          row.map((char, x) => {
            const revealed = isRevealed(x, y);
            const isMasked = masks[y][x];

            const xPercent = width > 1 ? (x / (width - 1)) * 99 : 0;
            const yPercent = height > 1 ? (y / (height - 1)) * 99 : 0;

            return (
              <div
                key={`${x}-${y}`}
                className={`w-8 h-8 md:w-12 md:h-12 short:lg:w-12 short:lg:h-12 lg:w-16 lg:h-16 bg-[#37383B] rounded flex items-center justify-center
                  ${isMasked ? "animate-cell-in" : "invisible pointer-events-none"}
                  ${revealed ? "ring-2 ring-blue-500/10" : ""}
                `}
                style={{
                  animationDelay: `${(x + y) * 50}ms`,
                  ...(revealed ? {
                    backgroundImage: `url('${getPath("/media/images/builds/nonogram-gradient.png")}')`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${width * 100}% ${height * 100}%`,
                    backgroundPosition: `${xPercent + 0.5}% ${yPercent + 0.5}%`,
                  } : {})
                }}
              >
                {isMasked && (
                 <span 
                    className={`text-[20px] short:lg:text-[32px] lg:text-[48px] font-medium leading-none select-none text-white
                      ${revealed 
                        ? "opacity-100 transition-opacity duration-500" 
                        : "opacity-0 transition-none"
                      }
                    `}
                  >
                    {char}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CrosswordGrid;
