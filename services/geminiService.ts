/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Сервис генерации пазлов - использует локальный генератор для бесконечных уровней
import { Puzzle } from "../types";
import { generatePuzzle as generateLocalPuzzle } from "./puzzleGenerator";

// Кэш сгенерированных пазлов
const puzzleCache: Map<number, Puzzle> = new Map();

/**
 * Генерирует пазл для указанного уровня
 * Использует локальный словарь для создания бесконечного количества уровней
 */
export async function generatePuzzle(level: number, previousWords: string[] = []): Promise<Puzzle> {
  // Проверяем кэш
  const cached = puzzleCache.get(level);
  if (cached) {
    puzzleCache.delete(level);
    return cached;
  }
  
  // Генерируем новый пазл
  const puzzle = await generateLocalPuzzle(level, previousWords);
  
  return puzzle;
}

/**
 * Предзагрузка следующего уровня в кэш
 */
export async function prefetchPuzzle(level: number, previousWords: string[] = []): Promise<void> {
  if (puzzleCache.has(level)) return;
  
  const puzzle = await generateLocalPuzzle(level, previousWords);
  puzzleCache.set(level, puzzle);
}
