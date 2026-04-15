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

  const footerTarget = document.getElementById('footer-portal-target');
  const overrideFooterStyle = `
    footer {
      position: static;
      padding-block: 8px;

      @media (min-width: 1280px) {
        position: fixed;
        padding-bottom: 0;
      }
    }
  `
 
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
          // Бесконечные уровни - всегда показываем модалку следующего уровня
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/1 backdrop-blur-2xl animate-in fade-in duration-300 animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-black px-[55px] lg:px-[40px] py-[50px] gap-[40px] rounded-3xl shadow-2xl flex flex-col items-center mx-[55px] rainbow-border w-full max-w-[430px] text-center">
        <h2 className="text-[48px] font-medium text-white tracking-[-1.2px] leading-[1.1]">Уровень {state.level} пройден</h2>
        <p className="text-white/70 text-lg">Очков: {state.score}</p>
        <div className="flex flex-col gap-[22px]">
          <button 
            onClick={() => {
              setState(prev => ({ ...prev, currentPuzzle: null, showLevelModal: false }));
              setTimeout(() => {
                loadLevel(state.level + 1);
              }, 10);
            }}
            className="bg-white py-[12px] text-[18px] leading-[1.6] tracking-[-0.36px] text-black rounded-full font-medium white-button h-[64px] px-[55px] md:px-[89px] whitespace-nowrap"
          >
            Следующий уровень →
          </button>
          <button 
            onClick={() => resetGame()}
            className="bg-[#202020] px-[20px] py-[12px] text-white rounded-full font-medium self-center px-[28px] whitespace-nowrap"
          >
            Начать заново
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col mx-auto rounded-2xl justify-center max-w-[1320px]">
      {state.showLevelModal && levelModal}

      <style>{`
        @keyframes sparkleAnim {
          to { transform: translate(var(--tx), var(--ty)); opacity: 0; }
        }
      `}</style>
      
      {/* Main Content Area - Grid and Wordwheel */}
      <div className="flex flex-col short:md:flex-row short:md:flex-1 lg:flex-1 lg:flex-row overflow-hidden gap-2 sm:gap-6 md:gap-10 md:gap-10 lg:gap-4">
        {/* Grid */}
        <div className="flex short:md:flex-1 lg:flex-1 items-start md:items-center justify-center lg:max-w-1/2">
          {state.currentPuzzle && (
            <CrosswordGrid puzzle={state.currentPuzzle} foundWords={state.foundWords} key={`$[state.currentPuzzle.difficulty]-${state.currentPuzzle.letters}`} />
          )}
        </div>

        {/* Wordwheel Section */}
        <div className="flex short:md:flex-1 short:md:justify-center lg:flex-1 flex-col items-center justify-start lg:justify-center relative">
          {/* Messaging / Guess Display */}
          <div className={`mb-[8px] sm:mb-[16px] short:md:mb-[16px] md:mb-[32px] mt-[8px] flex flex-col items-center whitespace-nowrap justify-center bg-white text-base text-black rounded-full font-medium px-7 py-2.5 leading-none ${!currentGuess && !uiMessage.text ? "invisible" : ""}`}>
            {currentGuess ? (
              <div className="animate-in fade-in zoom-in duration-200">
                <span className="">
                  {toSentenceCase(currentGuess)}
                </span>
              </div>
            ) : uiMessage.text ? (
              <div
                className={`transition-all
                ${uiMessage.type === "success" ? "text-black" : ""}
                ${uiMessage.type === "error" ? "text-[#514e4e]" : ""}
                ${uiMessage.type === "info" ? "text-black" : ""}
              `}
              >
                {toSentenceCase(uiMessage.text)}
              </div>
            ) : (
              <div className="">...</div>
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

      <style>
        {overrideFooterStyle}
      </style>

      {/* Actions */}
      <FooterLeftContent
        levelId={state.level}
        totalLevels={Infinity}
        score={state.score}
        button={handleHintRequest}
        buttonDisabled={state.score<30}
      />
      <InfoDialog title="Разгадайте кроссворд" goal="Соединяйте буквы непрерывной линией, чтобы составлять слова. Угадывайте правильные слова, и они заполнят сетку кроссворда. Разгадайте каждое слово, чтобы пройти уровень!" onClose={() => {}} />
    </div>
  );
};

export default App;
