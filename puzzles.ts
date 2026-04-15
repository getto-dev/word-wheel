/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Puzzle } from "./types";

export const WORD_WHEEL_PUZZLES: Puzzle[] = [
  {
    letters: 'КРОТ',
    difficulty: 1,
    words: [
      { word: 'КРОТ', x: 0, y: 0, direction: 'h' },
      { word: 'РОТ', x: 1, y: 0, direction: 'v' },
      { word: 'КОТ', x: 0, y: 0, direction: 'v' },
      { word: 'ТОК', x: 0, y: 2, direction: 'h' }
    ]
  },
  {
    letters: 'СПОРТ',
    difficulty: 1,
    words: [
      { word: 'СПОРТ', x: 0, y: 2, direction: 'h' },
      { word: 'ПОРТ', x: 1, y: 0, direction: 'v' },
      { word: 'РОТ', x: 1, y: 1, direction: 'h' },
      { word: 'ТОРС', x: 4, y: 0, direction: 'v' }
    ]
  },
  {
    letters: 'КНИГА',
    difficulty: 2,
    words: [
      { word: 'КНИГА', x: 0, y: 0, direction: 'h' },
      { word: 'ГИК', x: 3, y: 0, direction: 'v' },
      { word: 'ИНКА', x: 1, y: 0, direction: 'v' }
    ]
  },
  {
    letters: 'МОЛОКО',
    difficulty: 3,
    words: [
      { word: 'МОЛОКО', x: 0, y: 0, direction: 'h' },
      { word: 'ЛОМ', x: 0, y: 0, direction: 'v' },
      { word: 'КОМ', x: 4, y: 0, direction: 'v' },
      { word: 'ОКО', x: 1, y: 0, direction: 'v' }
    ]
  },
  {
    letters: 'РАБОТА',
    difficulty: 4,
    words: [
      { word: 'РАБОТА', x: 0, y: 0, direction: 'h' },
      { word: 'РОТ', x: 0, y: 0, direction: 'v' },
      { word: 'БОТ', x: 2, y: 0, direction: 'v' },
      { word: 'ТАРА', x: 4, y: 0, direction: 'v' }
    ]
  },
  {
    letters: 'СОЛНЦЕ',
    difficulty: 5,
    words: [
      { word: 'СОЛНЦЕ', x: 0, y: 0, direction: 'h' },
      { word: 'СОН', x: 0, y: 0, direction: 'v' },
      { word: 'ЛЕЦ', x: 2, y: 0, direction: 'v' }
    ]
  },
  {
    letters: 'ПЛАНЕТА',
    difficulty: 6,
    words: [
      { word: 'ПЛАНЕТА', x: 0, y: 0, direction: 'h' },
      { word: 'ПЛАН', x: 0, y: 0, direction: 'v' },
      { word: 'ЛЕНТА', x: 1, y: 0, direction: 'v' },
      { word: 'ПЕНА', x: 0, y: 3, direction: 'h' }
    ]
  }
];
