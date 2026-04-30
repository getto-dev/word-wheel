/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type Direction = "h" | "v";

export interface PuzzleWord {
  word: string;
  x: number;
  y: number;
  direction: Direction;
}

export interface Puzzle {
  letters: string;
  words: PuzzleWord[];
  difficulty: number;
  validBonusWords?: string[];
}

export interface GameState {
  level: number;
  score: number;
  foundWords: string[];
  bonusWords: string[];
  currentPuzzle: Puzzle | null;
  nextPuzzle: Puzzle | null;
  loading: boolean;
  isPrefetching?: boolean;
  message: string;
  gameWon?: boolean;
  showLevelModal: boolean;
  revealedLetters: Record<string, string[]>; // word -> array of revealed letter indices
  soundEnabled: boolean;
}

export interface SavedState {
  level: number;
  score: number;
  foundWords: string[];
  bonusWords: string[];
  usedWordsHistory: string[];
  revealedLetters: Record<string, string[]>;
  soundEnabled: boolean;
}
