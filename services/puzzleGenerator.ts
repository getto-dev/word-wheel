/**
 * Генератор пазлов для игры "Колесо слов"
 * Создаёт бесконечное количество уровней из словаря
 */

import { Puzzle, PuzzleWord, Direction } from '../types';
import { DICTIONARY, findWordsFromLetters, ALL_WORDS } from '../data/russianDictionary';

interface CrosswordCell {
  letter: string;
  wordStart: { word: string; direction: Direction }[];
}

/**
 * Генерирует пазл для указанного уровня
 */
export async function generatePuzzle(level: number, previousWords: string[] = []): Promise<Puzzle> {
  // Определяем длину слова на основе уровня
  const baseLength = Math.min(4 + Math.floor((level - 1) / 3), 8);
  const wordLength = baseLength + Math.floor(Math.random() * 2);
  
  // Выбираем случайное слово из словаря
  let mainWord = selectMainWord(wordLength, previousWords);
  
  // Находим все слова, которые можно составить из букв основного слова
  const possibleWords = findWordsFromLetters(mainWord, 3);
  
  // Фильтруем и выбираем слова для пазла
  const puzzleWords = selectPuzzleWords(mainWord, possibleWords, level, previousWords);
  
  // Определяем бонусные слова (те, что не вошли в кроссворд)
  const crosswordResult = buildCrossword(mainWord, puzzleWords);
  const crosswordWords = new Set(crosswordResult.map(w => w.word));
  const bonusWords = possibleWords.filter(w => !crosswordWords.has(w) && w !== mainWord);
  
  return {
    letters: mainWord,
    words: crosswordResult,
    difficulty: level,
    validBonusWords: bonusWords.slice(0, 20),
  };
}

/**
 * Выбирает основное слово для пазла
 */
function selectMainWord(length: number, previousWords: string[]): string {
  const words = DICTIONARY[length] || DICTIONARY[5];
  const availableWords = words.filter(w => !previousWords.includes(w));
  
  if (availableWords.length === 0) {
    return words[Math.floor(Math.random() * words.length)];
  }
  
  return availableWords[Math.floor(Math.random() * availableWords.length)];
}

/**
 * Выбирает слова для пазла из возможных
 */
function selectPuzzleWords(
  mainWord: string, 
  possibleWords: string[], 
  level: number,
  previousWords: string[]
): string[] {
  // Минимум слов зависит от уровня
  const minWords = Math.min(3 + Math.floor(level / 2), 8);
  const maxWords = Math.min(5 + Math.floor(level / 2), 10);
  
  // Фильтруем слова, которые ещё не использовались
  const availableWords = possibleWords.filter(w => 
    w !== mainWord && 
    !previousWords.includes(w) &&
    w.length >= 3
  );
  
  // Сортируем по длине (сначала короткие)
  const sorted = availableWords.sort((a, b) => a.length - b.length);
  
  // Берём слова разной длины для интереса
  const selected: string[] = [];
  const lengthsUsed = new Set<number>();
  
  // Сначала добавляем по одному слову каждой длины
  for (const word of sorted) {
    if (!lengthsUsed.has(word.length) && selected.length < maxWords) {
      selected.push(word);
      lengthsUsed.add(word.length);
    }
  }
  
  // Добираем до минимума
  while (selected.length < minWords) {
    const remaining = sorted.filter(w => !selected.includes(w));
    if (remaining.length === 0) break;
    
    const randomWord = remaining[Math.floor(Math.random() * remaining.length)];
    selected.push(randomWord);
  }
  
  return selected;
}

/**
 * Строит кроссворд из основного слова и дополнительных слов
 */
function buildCrossword(mainWord: string, additionalWords: string[]): PuzzleWord[] {
  const result: PuzzleWord[] = [];
  
  // Основное слово идёт горизонтально
  result.push({
    word: mainWord,
    x: 0,
    y: 0,
    direction: 'h'
  });
  
  // Создаём сетку для отслеживания пересечений и соседей
  const grid: Map<string, string> = new Map();
  for (let i = 0; i < mainWord.length; i++) {
    grid.set(`${i},0`, mainWord[i]);
  }
  
  // Размещаем дополнительные слова
  for (const word of additionalWords) {
    const placement = findBestPlacement(word, grid, mainWord, result);
    if (placement) {
      result.push(placement);
      
      // Обновляем сетку
      const dx = placement.direction === 'h' ? 1 : 0;
      const dy = placement.direction === 'v' ? 1 : 0;
      
      for (let i = 0; i < word.length; i++) {
        const x = placement.x + i * dx;
        const y = placement.y + i * dy;
        grid.set(`${x},${y}`, word[i]);
      }
    }
  }
  
  return result;
}

/**
 * Находит лучшее место для размещения слова
 * Учитывает правила кроссворда: нет параллельного прилегания без пересечения
 */
function findBestPlacement(
  word: string, 
  grid: Map<string, string>,
  mainWord: string,
  existingWords: PuzzleWord[]
): PuzzleWord | null {
  // Ищем пересечения с существующими буквами
  const intersections: { x: number; y: number; letterIdx: number; direction: Direction; score: number }[] = [];
  
  for (let letterIdx = 0; letterIdx < word.length; letterIdx++) {
    const letter = word[letterIdx];
    
    for (const [key, gridLetter] of grid.entries()) {
      if (gridLetter === letter) {
        const [x, y] = key.split(',').map(Number);
        
        // Проверяем вертикальное размещение
        if (canPlaceWord(word, x, y - letterIdx, 'v', grid)) {
          const score = countIntersections(word, x, y - letterIdx, 'v', grid);
          intersections.push({ x, y: y - letterIdx, letterIdx, direction: 'v', score });
        }
        
        // Проверяем горизонтальное размещение
        if (canPlaceWord(word, x - letterIdx, y, 'h', grid)) {
          const score = countIntersections(word, x - letterIdx, y, 'h', grid);
          intersections.push({ x: x - letterIdx, y, letterIdx, direction: 'h', score });
        }
      }
    }
  }
  
  if (intersections.length === 0) {
    // Если нет пересечений, пробуем разместить вертикально из первой буквы основного слова
    const mainLetter = word[0];
    for (let i = 0; i < mainWord.length; i++) {
      if (mainWord[i] === mainLetter) {
        return { word, x: i, y: 0, direction: 'v' };
      }
    }
    return null;
  }
  
  // Сортируем по количеству пересечений (больше = лучше) и берём лучшее
  intersections.sort((a, b) => b.score - a.score);
  
  // Из топовых пересечений выбираем случайное
  const topScore = intersections[0].score;
  const topIntersections = intersections.filter(i => i.score >= topScore * 0.5);
  const chosen = topIntersections[Math.floor(Math.random() * topIntersections.length)];
  
  return { word, x: chosen.x, y: chosen.y, direction: chosen.direction };
}

/**
 * Считает количество пересечений для оценки размещения
 */
function countIntersections(
  word: string,
  startX: number,
  startY: number,
  direction: Direction,
  grid: Map<string, string>
): number {
  const dx = direction === 'h' ? 1 : 0;
  const dy = direction === 'v' ? 1 : 0;
  let count = 0;
  
  for (let i = 0; i < word.length; i++) {
    const x = startX + i * dx;
    const y = startY + i * dy;
    const existing = grid.get(`${x},${y}`);
    if (existing && existing === word[i]) {
      count++;
    }
  }
  
  return count;
}

/**
 * Проверяет, можно ли разместить слово в указанном месте
 * Включает проверку на параллельное прилегание (adjacency rules)
 */
function canPlaceWord(
  word: string,
  startX: number,
  startY: number,
  direction: Direction,
  grid: Map<string, string>
): boolean {
  const dx = direction === 'h' ? 1 : 0;
  const dy = direction === 'v' ? 1 : 0;
  // Перпендикулярные направления для проверки соседей
  const perpDx = direction === 'h' ? 0 : 1;
  const perpDy = direction === 'h' ? 1 : 0;
  
  let hasIntersection = false;
  
  for (let i = 0; i < word.length; i++) {
    const x = startX + i * dx;
    const y = startY + i * dy;
    const key = `${x},${y}`;
    const existingLetter = grid.get(key);
    
    if (existingLetter && existingLetter !== word[i]) {
      return false; // Конфликт букв
    }
    
    if (existingLetter === word[i]) {
      hasIntersection = true;
    } else {
      // Проверяем параллельных соседей для этой ячейки (если нет пересечения)
      // Левый и правый соседи (для вертикального слова)
      // Верхний и нижний соседи (для горизонтального слова)
      const neighbor1 = grid.get(`${x + perpDx},${y + perpDy}`);
      const neighbor2 = grid.get(`${x - perpDx},${y - perpDy}`);
      
      if (neighbor1 || neighbor2) {
        return false; // Параллельное прилегание без пересечения
      }
    }
  }
  
  // Проверяем ячейки до и после слова
  const beforeX = startX - dx;
  const beforeY = startY - dy;
  const afterX = startX + word.length * dx;
  const afterY = startY + word.length * dy;
  
  if (grid.get(`${beforeX},${beforeY}`)) {
    return false; // Ячейка перед словом занята
  }
  if (grid.get(`${afterX},${afterY}`)) {
    return false; // Ячейка после слова занята
  }
  
  return true;
}

/**
 * Предзагрузка следующего уровня
 */
export async function prefetchNextLevel(level: number): Promise<Puzzle> {
  return generatePuzzle(level + 1);
}
