/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// src/services/geminiService.ts
import { Puzzle } from "../types";
import { WORD_WHEEL_PUZZLES } from "../puzzles";

/**
 * Simulates the previous AI generation by picking a pre-defined 
 * puzzle from our local data set based on difficulty.
 */
export async function generatePuzzle(level: number, previousWords: string[] = []): Promise<Puzzle> {
  // 1. Filter puzzles by difficulty. 
  // If no exact match for level, we take all puzzles as a fallback.
  let pool = WORD_WHEEL_PUZZLES.filter(p => p.difficulty === level);
  
  if (pool.length === 0) {
    pool = WORD_WHEEL_PUZZLES;
  }

  // 2. Pick a random puzzle from the pool
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selected = pool[randomIndex];

  // 3. Return in the expected Puzzle format
  // We add an empty array for validBonusWords since the static data doesn't have them
  return {
    ...selected,
    validBonusWords: []
  };
}