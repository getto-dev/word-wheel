/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Puzzle } from "../types";
import { getPath } from "../utils/path";

interface CrosswordGridProps {
  puzzle: Puzzle;
  foundWords: string[];
}

const CrosswordGrid: React.FC<CrosswordGridProps> = ({ puzzle, foundWords }) => {
  const [displayPuzzle, setDisplayPuzzle] = useState(puzzle);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(40);

  if (puzzle !== displayPuzzle && !isTransitioning) {
    setIsTransitioning(true);
  }

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setDisplayPuzzle(puzzle);
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [puzzle, displayPuzzle]);

  const currentPuzzle = displayPuzzle;

  if (!currentPuzzle.words || currentPuzzle.words.length === 0) return null;

  // Calculate grid bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
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

  const gridW = maxX - minX + 1;
  const gridH = maxY - minY + 1;

  // Build grid data
  const grid: (string | null)[][] = Array.from({ length: gridH }, () => Array(gridW).fill(null));
  const masks: boolean[][] = Array.from({ length: gridH }, () => Array(gridW).fill(false));

  currentPuzzle.words.forEach(pw => {
    const { word, x, y, direction } = pw;
    for (let i = 0; i < word.length; i++) {
      const curX = (direction === "h" ? x + i : x) - minX;
      const curY = (direction === "v" ? y + i : y) - minY;
      if (curX >= 0 && curX < gridW && curY >= 0 && curY < gridH) {
        grid[curY][curX] = word[i];
        masks[curY][curX] = true;
      }
    }
  });

  // Auto-scale cells to fit the container
  const recalcCellSize = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const parent = el.parentElement;
    if (!parent) return;

    const availableW = parent.clientWidth - 8; // minimal padding
    const availableH = parent.clientHeight - 8;

    // cell + gap, gap is ~4px on mobile, ~8px on desktop
    const isDesktop = window.innerWidth >= 768;
    const gap = isDesktop ? 8 : 4;
    
    const maxByW = Math.floor((availableW - (gridW - 1) * gap) / gridW);
    const maxByH = Math.floor((availableH - (gridH - 1) * gap) / gridH);
    
    let size = Math.min(maxByW, maxByH);
    // Clamp between 28px (very small) and 80px (desktop max)
    size = Math.max(28, Math.min(80, size));

    setCellSize(size);
  }, [gridW, gridH]);

  useEffect(() => {
    recalcCellSize();

    const el = wrapperRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => recalcCellSize());
    observer.observe(el.parentElement!);
    return () => observer.disconnect();
  }, [recalcCellSize]);

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

  const gap = cellSize >= 48 ? 6 : 3;
  const fontSize = cellSize >= 64 ? 48 : cellSize >= 48 ? 36 : cellSize >= 40 ? 28 : cellSize >= 32 ? 22 : 18;

  return (
    <div ref={wrapperRef} className="flex justify-center items-center w-full h-full overflow-hidden">
      <style>{`
        @keyframes cellFadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .cell-animate {
          opacity: 0;
          animation: cellFadeIn 0.4s ease-out forwards;
        }
      `}</style>
      <div
        key={JSON.stringify(`${currentPuzzle.letters}-${currentPuzzle.difficulty}`)}
        className={`grid justify-center items-center transition-opacity duration-300
          ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        style={{
          gridTemplateColumns: `repeat(${gridW}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridH}, ${cellSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {grid.map((row, y) =>
          row.map((char, x) => {
            const revealed = isRevealed(x, y);
            const isMasked = masks[y][x];
            const xPercent = gridW > 1 ? (x / (gridW - 1)) * 99 : 0;
            const yPercent = gridH > 1 ? (y / (gridH - 1)) * 99 : 0;

            return (
              <div
                key={`${x}-${y}`}
                className={`bg-[#37383B] rounded-[6px] flex items-center justify-center
                  ${isMasked ? "cell-animate" : "invisible pointer-events-none"}
                  ${revealed ? "ring-2 ring-blue-500/10" : ""}
                `}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  animationDelay: `${(x + y) * 40}ms`,
                  ...(revealed ? {
                    backgroundImage: `url('${getPath("/media/images/builds/nonogram-gradient.png")}')`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${gridW * 100}% ${gridH * 100}%`,
                    backgroundPosition: `${xPercent + 0.5}% ${yPercent + 0.5}%`,
                  } : {})
                }}
              >
                {isMasked && (
                  <span 
                    className={`font-medium leading-none select-none text-white
                      ${revealed 
                        ? "opacity-100 transition-opacity duration-500" 
                        : "opacity-0 transition-none"
                      }`}
                    style={{ fontSize: `${fontSize}px` }}
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
