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
}

export interface GameState {
  level: number;
  score: number;
  foundWords: string[];
  currentPuzzle: Puzzle | null;
  nextPuzzle: Puzzle | null;
  loading: boolean;
  isPrefetching?: boolean;
  message: string;
  gameWon?: boolean;
  showLevelModal: boolean;
}
