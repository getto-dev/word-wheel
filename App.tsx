/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from "react";
import { generatePuzzle } from "./services/geminiService";
import FooterLeftContent from './components/FooterLeftContent';
import { Puzzle, GameState } from "./types";
import WordWheel from "./components/WordWheel";
import CrosswordGrid from "./components/CrosswordGrid";
import useAudio from "./hooks/useAudio";
import { getPath } from "./utils/path";
import InfoDialog from './components/builds/infoDialog.tsx'

const LEVEL_1_PUZZLE: Puzzle = {
  difficulty: 1,
  letters: "КРОТ",
  words: [
    { word: "КРОТ", x: 0, y: 0, direction: "h" },
    { word: "РОТ", x: 1, y: 0, direction: "v" },
    { word: "КОТ", x: 0, y: 0, direction: "v" },
    { word: "ТОК", x: 0, y: 2, direction: "h" },
  ]
};

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    level: 1,
    score: 30,
    foundWords: [],
    currentPuzzle: null,
    nextPuzzle: null,
    loading: true,
    message: "",
    gameWon: false,
    showLevelModal: false
  });

  const [currentGuess, setCurrentGuess] = useState("");
  const [uiMessage, setUiMessage] = useState({ text: "", type: "info" });
  const usedWordsHistory = useRef<string[]>([]);
  const activeFetch = useRef<{ level: number; promise: Promise<Puzzle> } | null>(null);
  const { playForeground } = useAudio();

  const prefetchNextLevel = useCallback(async (currentLevel: number) => {
    const targetLevel = currentLevel + 1;
    if (activeFetch.current?.level === targetLevel) return;

    setState(prev => ({ ...prev, isPrefetching: true }));
    const promise = generatePuzzle(targetLevel, usedWordsHistory.current.slice(-50));
    activeFetch.current = { level: targetLevel, promise };

    try {
      const puzzle = await promise;
      console.log("Generated Next Level Puzzle:", puzzle);
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
      if (level === 1) {
        setState(prev => ({
          ...prev,
          currentPuzzle: LEVEL_1_PUZZLE,
          foundWords: [],
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

        console.log("Generated Current Level Puzzle:", puzzle);
        setState(prev => ({
          ...prev,
          currentPuzzle: puzzle,
          nextPuzzle: null,
          foundWords: [],
          loading: false,
          isPrefetching: false,
          level: level,
        }));
      } catch (e) {
        console.error(e);
      }
    },
    [state.nextPuzzle, prefetchNextLevel]
  );

  useEffect(() => {
    loadLevel(state.level);
  }, []);

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

        if (newFoundWords.length === state.currentPuzzle.words.length) {
          showTemporaryMessage("УРОВЕНЬ ПРОЙДЕН", "success");
          playForeground(getPath("/media/audio/sfx/global/win.mp3"))
          setTimeout(() => setState(prev => ({ ...prev, showLevelModal: true })), 1200);
        }
      }
    } else {
      showTemporaryMessage("НЕТ В ПАЗЛЕ", "error");
      playForeground(getPath("/media/audio/sfx/wordwheel/incorrectword.mp3"));
    }
    setCurrentGuess("");
  };

  const resetGame = async () => {
    playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"));
    usedWordsHistory.current = [];
    activeFetch.current = null;

    setState({
      level: 1,
      score: 0,
      foundWords: [],
      currentPuzzle: LEVEL_1_PUZZLE,
      nextPuzzle: null,
      loading: false,
      message: "Начинаем заново...",
      gameWon: false,
      showLevelModal: false,
      isPrefetching: false
    });

    setCurrentGuess("");
  };

  const handleHintRequest = () => {
    if (!state.currentPuzzle || state.score < 30) return;
    
    const unfound = state.currentPuzzle.words.filter(
      w => !state.foundWords.includes(w.word)
    );
    if (unfound.length > 0) {
      const randomWord = unfound[Math.floor(Math.random() * unfound.length)].word;
      const newFoundWords = [...state.foundWords, randomWord];
      usedWordsHistory.current.push(randomWord);

      setState(prev => ({
        ...prev,
        foundWords: newFoundWords,
        score: prev.score - 30,
      }));

      showTemporaryMessage("ПОДСКАЗКА ИСПОЛЬЗОВАНА", "info");
      playForeground(getPath("/media/audio/sfx/global/buttonclick.mp3"))

      if (newFoundWords.length === state.currentPuzzle.words.length) {
        setTimeout(() => {
          showTemporaryMessage("УРОВЕНЬ ПРОЙДЕН", "success");
          playForeground(getPath("/media/audio/sfx/global/win.mp3"));
          setTimeout(() => setState(prev => ({ ...prev, showLevelModal: true })), 600);
        }, 500);
      }
    }
  }

  const toSentenceCase = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const showTemporaryMessage = (text: string, type: "info" | "success" | "error") => {
    setUiMessage({ text, type });
    setTimeout(() => setUiMessage({ text: "", type: "info" }), 1000);
  };

  const levelModal = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-center animate-[fadeIn_0.2s_ease-out]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* Card — bottom sheet on mobile, centered on sm+ */}
      <div className="relative z-10 w-full sm:w-auto sm:max-w-[400px] bg-black rounded-t-2xl sm:rounded-3xl shadow-2xl flex flex-col items-center text-center animate-[slideInUp_0.3s_ease-out]
        px-6 py-6 sm:px-[55px] sm:py-[50px] mb-0 sm:mb-0
        pb-[calc(24px+env(safe-area-inset-bottom,0px))] sm:pb-[50px]">
        <div className="w-10 h-1 rounded-full bg-white/20 mb-4 sm:hidden" />
        <h2 className="text-[28px] sm:text-[48px] font-medium text-white tracking-tight leading-tight">
          Уровень {state.level} пройден
        </h2>
        <p className="text-white/50 text-sm sm:text-lg mt-1">Очков: {state.score}</p>
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
      
      {/*
        MOBILE LAYOUT (<768px):
        ┌──────────────────────────┐
        │  Crossword Grid (flex-1) │ ← fills remaining space
        ├──────────────────────────┤
        │  [Word Pill]             │ ← minimal, 28px
        │  [WordWheel]             │ ← fixed ~220px height
        ├──────────────────────────┤
        │  Footer (auto)           │ ← compact bar
        └──────────────────────────┘

        DESKTOP LAYOUT (≥768px):
        ┌─────────────┬────────────┐
        │  Crossword  │  WordWheel │ ← side by side, centered
        │  Grid       │  + pill    │
        └─────────────┴────────────┘
        │  Footer                  │
      */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row md:items-center overflow-hidden">

        {/* ===== CROSSWORD GRID ===== */}
        {/* Mobile: flex-1 fills available space above wheel+footer */}
        {/* Desktop: takes half width */}
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden
          py-2 md:py-0 md:flex-1 md:max-w-1/2">
          {state.currentPuzzle && (
            <CrosswordGrid 
              puzzle={state.currentPuzzle} 
              foundWords={state.foundWords} 
              key={`${state.currentPuzzle.difficulty}-${state.currentPuzzle.letters}`} 
            />
          )}
        </div>

        {/* ===== WHEEL SECTION ===== */}
        {/* Mobile: fixed at bottom, ~220px total (pill + wheel) */}
        {/* Desktop: takes other half, vertically centered */}
        <div className="flex flex-col items-center justify-center
          flex-shrink-0 md:flex-shrink md:flex-1 md:max-w-1/2 md:justify-center
          relative">
          
          {/* Guess display pill — hidden on mobile when empty to save space */}
          <div className={`h-7 md:h-auto flex items-center justify-center mb-1 md:mb-4 lg:mb-6
            ${!currentGuess && !uiMessage.text ? "md:invisible" : ""}`}>
            {(currentGuess || uiMessage.text) && (
              <div className="bg-white text-black rounded-full font-medium
                px-4 py-1 md:px-7 md:py-2.5
                text-[13px] md:text-base leading-none whitespace-nowrap
                animate-[fadeIn_0.15s_ease-out]">
                {currentGuess ? toSentenceCase(currentGuess) : toSentenceCase(uiMessage.text)}
              </div>
            )}
          </div>
          
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
        buttonDisabled={state.score < 30}
      />
      <InfoDialog 
        title="Разгадайте кроссворд" 
        goal="Соединяйте буквы непрерывной линией, чтобы составлять слова. Угадывайте правильные слова, и они заполнят сетку кроссворда. Разгадайте каждое слово, чтобы пройти уровень!" 
        onClose={() => {}} 
      />
    </div>
  );
};

export default App;
