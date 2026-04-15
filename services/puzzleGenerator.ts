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
  
  // Создаём кроссворд
  const crossword = buildCrossword(mainWord, puzzleWords);
  
  return {
    letters: mainWord,
    words: crossword,
    difficulty: level,
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
  
  // Создаём сетку для отслеживания пересечений
  const grid: Map<string, string> = new Map();
  for (let i = 0; i < mainWord.length; i++) {
    grid.set(`${i},0`, mainWord[i]);
  }
  
  // Размещаем дополнительные слова
  for (const word of additionalWords) {
    const placement = findBestPlacement(word, grid, mainWord);
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
 */
function findBestPlacement(
  word: string, 
  grid: Map<string, string>,
  mainWord: string
): PuzzleWord | null {
  // Ищем пересечения с существующими буквами
  const intersections: { x: number; y: number; letterIdx: number; direction: Direction }[] = [];
  
  for (let letterIdx = 0; letterIdx < word.length; letterIdx++) {
    const letter = word[letterIdx];
    
    for (const [key, gridLetter] of grid.entries()) {
      if (gridLetter === letter) {
        const [x, y] = key.split(',').map(Number);
        
        // Проверяем горизонтальное размещение
        const canPlaceHorizontal = canPlaceWord(word, x - letterIdx, y, 'h', grid);
        if (canPlaceHorizontal) {
          intersections.push({ x: x - letterIdx, y, letterIdx, direction: 'h' });
        }
        
        // Проверяем вертикальное размещение
        const canPlaceVertical = canPlaceWord(word, x, y - letterIdx, 'v', grid);
        if (canPlaceVertical) {
          intersections.push({ x, y: y - letterIdx, letterIdx, direction: 'v' });
        }
      }
    }
  }
  
  if (intersections.length === 0) {
    // Если нет пересечений, пробуем разместить рядом с основным словом
    const direction = Math.random() > 0.5 ? 'v' : 'h';
    if (direction === 'v') {
      // Вертикально под первой буквой основного слова
      return { word, x: 0, y: 0, direction: 'v' };
    }
    return null;
  }
  
  // Выбираем случайное пересечение
  const chosen = intersections[Math.floor(Math.random() * intersections.length)];
  return { word, x: chosen.x, y: chosen.y, direction: chosen.direction };
}

/**
 * Проверяет, можно ли разместить слово в указанном месте
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
  
  for (let i = 0; i < word.length; i++) {
    const x = startX + i * dx;
    const y = startY + i * dy;
    const key = `${x},${y}`;
    const existingLetter = grid.get(key);
    
    if (existingLetter && existingLetter !== word[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Предзагрузка следующего уровня
 */
export async function prefetchNextLevel(level: number): Promise<Puzzle> {
  return generatePuzzle(level + 1);
}
