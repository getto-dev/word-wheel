/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from "react";
import { generatePuzzle } from "./services/geminiService";
import FooterLeftContent from './components/FooterLeftContent';
import { Puzzle, GameState, SavedState } from "./types";
import WordWheel from "./components/WordWheel";
import CrosswordGrid from "./components/CrosswordGrid";
import useAudio from "./hooks/useAudio";
import { getPath } from "./utils/path";
import { findWordsFromLetters } from "./data/russianDictionary";
import InfoDialog from './components/builds/infoDialog.tsx'

const STORAGE_KEY = 'word-wheel-save';
const FIRST_VISIT_KEY = 'word-wheel-visited';

const LEVEL_1_PUZZLE: Puzzle = {
  difficulty: 1,
  letters: "КРОТ",
  words: [
    { word: "КРОТ", x: 0, y: 0, direction: "h" },
    { word: "РОТ", x: 1, y: 0, direction: "v" },
    { word: "КОТ", x: 0, y: 0, direction: "v" },
    { word: "ТОК", x: 0, y: 2, direction: "h" },
  ],
  validBonusWords: ['ОРТ'],
};

function loadSavedState(): Partial<SavedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

function saveState(state: GameState, usedWordsHistory: string[]) {
  try {
    const saved: SavedState = {
      level: state.level,
      score: state.score,
      foundWords: state.foundWords,
      bonusWords: state.bonusWords,
      usedWordsHistory,
      revealedLetters: state.revealedLetters,
      soundEnabled: state.soundEnabled,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {}
}

function clearSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function isFirstVisit(): boolean {
  try {
    return !localStorage.getItem(FIRST_VISIT_KEY);
  } catch {
    return true;
  }
}

function markVisited() {
  try {
    localStorage.setItem(FIRST_VISIT_KEY, '1');
  } catch {}
}

function vibrate(pattern: number | number[]) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

const App: React.FC = () => {
  const saved = useRef(loadSavedState());
  const [showInfoDialog, setShowInfoDialog] = useState(isFirstVisit());

  const [state, setState] = useState<GameState>({
    level: saved.current?.level || 1,
    score: saved.current?.score || 0,
    foundWords: saved.current?.foundWords || [],
    bonusWords: saved.current?.bonusWords || [],
    currentPuzzle: null,
    nextPuzzle: null,
    loading: true,
    message: "",
    gameWon: false,
    showLevelModal: false,
    revealedLetters: saved.current?.revealedLetters || {},
    soundEnabled: saved.current?.soundEnabled !== undefined ? saved.current!.soundEnabled : true,
  });

  const [currentGuess, setCurrentGuess] = useState("");
  const [uiMessage, setUiMessage] = useState({ text: "", type: "info" });
  const usedWordsHistory = useRef<string[]>(saved.current?.usedWordsHistory || []);
  const activeFetch = useRef<{ level: number; promise: Promise<Puzzle> } | null>(null);
  const { playForeground } = useAudio(state.soundEnabled);

  const prefetchNextLevel = useCallback(async (currentLevel: number) => {
    const targetLevel = currentLevel + 1;
    if (activeFetch.current?.level === targetLevel) return;

    setState(prev => ({ ...prev, isPrefetching: true }));
    const promise = generatePuzzle(targetLevel, usedWordsHistory.current.slice(-50));
    activeFetch.current = { level: targetLevel, promise };

    try {
      const puzzle = await promise;
      setState(prev => {
        if (puzzle.difficulty <= prev.level) {
          return { ...prev, isPrefetching: false };
        }
        return { ...prev, nextPuzzle: puzzle, isPrefetching: false };
      });
    } catch (e) {
      console.warn("Prefetch failed", e);
      setState(prev => ({ ...prev, isPrefetching: false }));
    } finally {
      if (activeFetch.current?.level === targetLevel) {
        activeFetch.current = null;
      }
    }
  }, []);

  const handleWheelInteraction = useCallback(() => {
    if (state.nextPuzzle || activeFetch.current) return;
    prefetchNextLevel(state.level);
  }, [state.level, state.nextPuzzle, prefetchNextLevel]);

  const loadLevel = useCallback(
    async (level: number) => {
      if (level === 1 && !saved.current?.level) {
        setState(prev => ({
          ...prev,
          currentPuzzle: LEVEL_1_PUZZLE,
          foundWords: [],
          bonusWords: [],
          loading: false,
          level: 1,
          nextPuzzle: null,
        }));
        return;
      }

      if (state.nextPuzzle && state.nextPuzzle.difficulty === level) {
        setState(prev => ({
          ...prev,
          currentPuzzle: prev.nextPuzzle,
          nextPuzzle: null,
          foundWords: [],
          bonusWords: [],
          loading: false,
          level: level,
        }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, message: `Загрузка уровня ${level}...` }));
      try {
        let puzzle: Puzzle;
        if (activeFetch.current?.level === level) {
          puzzle = await activeFetch.current.promise;
        } else {
          const promise = generatePuzzle(level, usedWordsHistory.current.slice(-50));
          activeFetch.current = { level, promise };
          try {
            puzzle = await promise;
          } finally {
            if (activeFetch.current?.level === level) {
              activeFetch.current = null;
            }
          }
        }

        setState(prev => ({
          ...prev,
          currentPuzzle: puzzle,
          nextPuzzle: null,
          foundWords: [],
          bonusWords: [],
          loading: false,
          isPrefetching: false,
          level: level,
          revealedLetters: {},
        }));
      } catch (e) {
        console.error(e);
      }
    },
    [state.nextPuzzle, prefetchNextLevel]
  );

  useEffect(() => {
    // If we have a saved state with a level, try to restore that level
    if (saved.current?.level && saved.current.level > 1) {
      // Reset saved data and start fresh since puzzle state is complex
      // We keep the score and level info but regenerate the puzzle
      setState(prev => ({
        ...prev,
        currentPuzzle: null,
        loading: true,
      }));
      loadLevel(saved.current!.level);
      saved.current = null; // Only restore once
    } else {
      loadLevel(1);
    }
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (!state.loading && state.currentPuzzle) {
      saveState(state, usedWordsHistory.current);
    }
  }, [state.level, state.score, state.foundWords, state.bonusWords, state.soundEnabled, state.revealedLetters]);

  const handleWordSubmit = (word: string) => {
    if (!state.currentPuzzle) return;
    const targetWord = state.currentPuzzle.words.find(w => w.word === word);

    if (targetWord) {
      if (state.foundWords.includes(word)) {
        showTemporaryMessage("УЖЕ НАЙДЕНО", "info");
        playForeground(getPath("/media/audio/sfx/wordwheel/incorrectword.mp3"))
      } else {
        const newFoundWords = [...state.foundWords, word];
        usedWordsHistory.current.push(word);
        setState(prev => ({
          ...prev,
          foundWords: newFoundWords,
          score: prev.score + word.length * 20,
        }));
        showTemporaryMessage("ОТЛИЧНО", "success");
        playForeground(getPath("/media/audio/sfx/wordwheel/correctword.mp3"))
        vibrate(50);

        if (newFoundWords.length === state.currentPuzzle!.words.length) {
          showTemporaryMessage("УРОВЕНЬ ПРОЙДЕН", "success");
          playForeground(getPath("/media/audio/sfx/global/win.mp3"))
          vibrate([100, 50, 100, 50, 200]);
          setTimeout(() => setState(prev => ({ ...prev, showLevelModal: true })), 1200);
        }
      }
    } else if (state.bonusWords.includes(word)) {
      showTemporaryMessage("УЖЕ НАЙДЕНО", "info");
      playForeground(getPath("/media/audio/sfx/wordwheel/incorrectword.mp3"))
    } else {
      // Check if it's a valid bonus word from letters
      const possibleBonus = state.currentPuzzle.validBonusWords ||
        findWordsFromLetters(state.currentPuzzle.letters, 3);
      const allFound = [...state.foundWords, ...state.bonusWords];

      if (possibleBonus.includes(word) && !allFound.includes(word) &&
          !state.currentPuzzle.words.some(w => w.word === word)) {
        // It's a valid bonus word!
        const newBonusWords = [...state.bonusWords, word];
        usedWordsHistory.current.push(word);
        setState(prev => ({
          ...prev,
          bonusWords: newBonusWords,
          score: prev.score + word.length * 10,
        }));
        showTemporaryMessage("БОНУС +" + (word.length * 10), "success");
        playForeground(getPath("/media/audio/sfx/wordwheel/correctword.mp3"))
        vibrate(30);
      } else {
        showTemporaryMessage("НЕТ В ПАЗЛЕ", "error");
        playForeground(getPath("/media/audio/sfx/wordwheel/incorrectword.mp3"));
        vibrate(100);
      }
    }
    setCurrentGuess("");
  };

  const resetGame = async () => {
    playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
    usedWordsHistory.current = [];
    activeFetch.current = null;
    clearSavedState();

    setState({
      level: 1,
      score: 0,
      foundWords: [],
      bonusWords: [],
      currentPuzzle: LEVEL_1_PUZZLE,
      nextPuzzle: null,
      loading: false,
      message: "Начинаем заново...",
      gameWon: false,
      showLevelModal: false,
      isPrefetching: false,
      revealedLetters: {},
      soundEnabled: state.soundEnabled,
    });

    setCurrentGuess("");
  };

  const handleHintRequest = () => {
    if (!state.currentPuzzle || state.score < 20) return;

    const unfound = state.currentPuzzle.words.filter(
      w => !state.foundWords.includes(w.word)
    );
    if (unfound.length > 0) {
      // Pick a random unfound word
      const randomWord = unfound[Math.floor(Math.random() * unfound.length)].word;

      // Get currently revealed letters for this word
      const currentRevealed = state.revealedLetters[randomWord] || [];

      // Find unrevealed letter indices
      const unrevealedIndices = [];
      for (let i = 0; i < randomWord.length; i++) {
        if (!currentRevealed.includes(String(i))) {
          unrevealedIndices.push(i);
        }
      }

      if (unrevealedIndices.length > 0) {
        // Reveal one random letter
        const revealIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        const newRevealed = [...currentRevealed, String(revealIdx)];

        setState(prev => ({
          ...prev,
          score: prev.score - 20,
          revealedLetters: {
            ...prev.revealedLetters,
            [randomWord]: newRevealed,
          },
        }));

        showTemporaryMessage(`ПОДСКАЗКА: ${randomWord[revealIdx]} −20`, "info");
        playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"))
        vibrate(20);

        // If all letters of this word are revealed, auto-complete it
        if (newRevealed.length === randomWord.length) {
          const newFoundWords = [...state.foundWords, randomWord];
          usedWordsHistory.current.push(randomWord);
          setState(prev => ({
            ...prev,
            foundWords: newFoundWords,
            revealedLetters: {
              ...prev.revealedLetters,
              [randomWord]: [],
            },
          }));

          if (newFoundWords.length === state.currentPuzzle!.words.length) {
            setTimeout(() => {
              showTemporaryMessage("УРОВЕНЬ ПРОЙДЕН", "success");
              playForeground(getPath("/media/audio/sfx/global/win.mp3"));
              vibrate([100, 50, 100, 50, 200]);
              setTimeout(() => setState(prev => ({ ...prev, showLevelModal: true })), 600);
            }, 500);
          }
        }
      }
    }
  };

  const toggleSound = () => {
    setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const toSentenceCase = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const showTemporaryMessage = (text: string, type: "info" | "success" | "error") => {
    setUiMessage({ text, type });
    setTimeout(() => setUiMessage({ text: "", type: "info" }), 1000);
  };

  const totalWords = state.currentPuzzle?.words.length || 0;
  const foundCount = state.foundWords.length;

  const levelModal = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-center animate-[fadeIn_0.2s_ease-out]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full sm:w-auto sm:max-w-[400px] bg-black rounded-t-2xl sm:rounded-3xl shadow-2xl flex flex-col items-center text-center animate-[slideInUp_0.3s_ease-out]
        px-6 py-6 sm:px-[55px] sm:py-[50px] mb-0 sm:mb-0
        pb-[calc(24px+env(safe-area-inset-bottom,0px))] sm:pb-[50px]">
        <div className="w-10 h-1 rounded-full bg-white/20 mb-4 sm:hidden" />
        <h2 className="text-[28px] sm:text-[48px] font-medium text-white tracking-tight leading-tight">
          Уровень {state.level} пройден
        </h2>
        <p className="text-white/50 text-sm sm:text-lg mt-1">Очков: {state.score}</p>
        {state.bonusWords.length > 0 && (
          <p className="text-white/30 text-xs sm:text-sm mt-0.5">Бонусные слова: {state.bonusWords.length}</p>
        )}
        <div className="flex flex-col gap-3 sm:gap-[22px] w-full mt-5 sm:mt-[40px]">
          <button 
            onClick={() => {
              setState(prev => ({ ...prev, currentPuzzle: null, showLevelModal: false }));
              setTimeout(() => { loadLevel(state.level + 1); }, 10);
            }}
            className="w-full sm:w-auto bg-white py-3.5 sm:py-3 px-8 sm:px-[55px] md:px-[89px] text-[16px] sm:text-[18px] leading-tight tracking-tight text-black rounded-full font-medium white-button h-[50px] sm:h-[64px] whitespace-nowrap flex items-center justify-center"
          >
            Следующий уровень →
          </button>
          <button 
            onClick={() => resetGame()}
            className="bg-white/10 active:bg-white/20 px-5 py-3 text-white rounded-full font-medium self-center whitespace-nowrap text-[14px] sm:text-base h-[44px] flex items-center justify-center"
          >
            Начать заново
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="game-area w-full h-full flex flex-col max-w-[1320px] mx-auto">
      {state.showLevelModal && levelModal}

      <style>{`
        @keyframes sparkleAnim {
          to { transform: translate(var(--tx), var(--ty)); opacity: 0; }
        }
      `}</style>
      
      <div className="flex-1 min-h-0 flex flex-col md:flex-row md:items-center overflow-hidden">

        {/* ===== CROSSWORD GRID ===== */}
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden
          p-1 md:p-0 md:flex-1 md:max-w-1/2">
          {state.currentPuzzle && (
            <CrosswordGrid 
              puzzle={state.currentPuzzle} 
              foundWords={state.foundWords} 
              revealedLetters={state.revealedLetters}
              key={`${state.currentPuzzle.difficulty}-${state.currentPuzzle.letters}`} 
            />
          )}
        </div>

        {/* ===== WHEEL SECTION ===== */}
        <div className="flex flex-col items-center justify-center
          flex-shrink-0 md:flex-shrink md:flex-1 md:max-w-1/2 md:justify-center
          relative">
          
          {/* Guess display pill + word counter */}
          <div className={`h-7 md:h-auto flex items-center justify-center mb-1 md:mb-4 lg:mb-6
            ${!currentGuess && !uiMessage.text ? "md:invisible" : ""}`}>
            {(currentGuess || uiMessage.text) && (
              <div className={`rounded-full font-medium
                px-4 py-1 md:px-7 md:py-2.5
                text-[13px] md:text-base leading-none whitespace-nowrap
                animate-[fadeIn_0.15s_ease-out]
                ${uiMessage.type === 'error' ? 'bg-red-500/80 text-white' :
                  uiMessage.type === 'success' ? 'bg-green-500/80 text-white' :
                  'bg-white text-black'}`}>
                {currentGuess ? toSentenceCase(currentGuess) : toSentenceCase(uiMessage.text)}
              </div>
            )}
          </div>

          {/* Word counter */}
          {state.currentPuzzle && (
            <div className="text-white/40 text-xs md:text-sm font-medium mb-1 md:mb-2 tracking-wide">
              {foundCount}/{totalWords} слов
              {state.bonusWords.length > 0 && (
                <span className="text-yellow-400/50 ml-1">+{state.bonusWords.length} бонус</span>
              )}
            </div>
          )}
          
          {/* Wheel */}
          {state.currentPuzzle && (
            <WordWheel
              key={state.currentPuzzle.letters}
              letters={state.currentPuzzle.letters}
              onWordSubmit={handleWordSubmit}
              onCurrentWordChange={setCurrentGuess}
              onInteraction={handleWheelInteraction}
            />
          )}
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <FooterLeftContent
        levelId={state.level}
        totalLevels={Infinity}
        score={state.score}
        button={handleHintRequest}
        buttonDisabled={state.score < 20}
        soundEnabled={state.soundEnabled}
        onToggleSound={toggleSound}
      />

      {/* Info Dialog — only on first visit */}
      {showInfoDialog && (
        <InfoDialog 
          title="Разгадайте кроссворд" 
          goal="Соединяйте буквы непрерывной линией, чтобы составлять слова. Угадывайте правильные слова, и они заполнят сетку кроссворда. Разгадайте каждое слово, чтобы пройти уровень!" 
          goalNote="Бонусные слова дают дополнительные очки!"
          onClose={() => { setShowInfoDialog(false); markVisited(); }} 
        />
      )}
    </div>
  );
};

export default App;
