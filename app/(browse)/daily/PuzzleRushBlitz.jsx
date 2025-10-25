'use client';

import { useEffect, useRef, useState } from "react";
import Link from 'next/link';
import PuzzleRushBrain from './PuzzleRushBrain';

export default function PuzzleRushBlitz({ puzzles }) {
  const INITIAL_SECONDS = 180; // 3 minutes

  // phases: 'countdown' -> 'flash' -> 'playing' -> 'ended'
  const [phase, setPhase] = useState('countdown');
  const [count, setCount] = useState(3);

  const [timeLeft, setTimeLeft] = useState(INITIAL_SECONDS);
  const [score, setScore] = useState(0);
  const [sessionKey, setSessionKey] = useState(() => Date.now());
  const [combo, setCombo] = useState(0);
  const [comboHighlight, setComboHighlight] = useState(null);
  const highlightTimeoutRef = useRef(null);
  const [sideToMove, setSideToMove] = useState('white');

  const [highestCombo, setHighestCombo] = useState(0);
  const [mistakeCount, setMistakeCount] = useState(0);

  const [failedPuzzles, setFailedPuzzles] = useState([]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  // ——— Pre-game countdown ———
  useEffect(() => {
    if (phase !== 'countdown') return;

    setCount(3);
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          setPhase('flash'); // after 1 → show START!
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [phase]);

  // ——— START! flash ———
  useEffect(() => {
    if (phase !== 'flash') return;
    const id = setTimeout(() => setPhase('playing'), 600);
    return () => clearTimeout(id);
  }, [phase]);

  // ——— Main game timer ———
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      setPhase('ended');
      console.log(failedPuzzles)
      console.log(phase)
      return;
    }

    const tick = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(tick);
  }, [phase, timeLeft]);

  function triggerComboHighlight(nextCombo) {
    let colorClass = null;

    if (nextCombo < 5) {
      colorClass = 'text-yellow-400';
    } else if (nextCombo < 10) {
      colorClass = 'text-orange-400';
    } else {
      colorClass = 'text-red-500';
    }

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    setComboHighlight(colorClass);
    highlightTimeoutRef.current = setTimeout(() => {
      setComboHighlight(null);
      highlightTimeoutRef.current = null;
    }, 500);
  }

  function onCorrect() {
    setScore((p) => p + 1);
    setCombo((prev) => {
      const next = prev + 1;
      setHighestCombo((currentMax) => (next > currentMax ? next : currentMax));
      triggerComboHighlight(next);
      return next;
    });
  }

  function onWrong(failure) {
    setCombo((prev) => {
      setHighestCombo((currentMax) => (prev > currentMax ? prev : currentMax));
      return 0;
    });
    if (failure) {
      setFailedPuzzles((prev) => [...prev, failure]);
    }

    setMistakeCount((prev) => prev + 1);

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
    setComboHighlight(null);
  }

  function resetGame() {
    setScore(0);
    setFailedPuzzles([]);
    setMistakeCount(0);
    setSessionKey((p) => p + 1);
    setTimeLeft(INITIAL_SECONDS);
    setCombo(0);
    setSideToMove('white');
    setHighestCombo(0);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
    setComboHighlight(null);
    setPhase('countdown'); // restart with countdown
  }

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const timerLabel = `${minutes}:${seconds}`;

  const isPreGame = phase === 'countdown' || phase === 'flash';
  const showStart = phase === 'flash';
  const preGameLabel = showStart ? 'START!' : count;
  const comboHighlightClass = `transition-colors duration-150 text-lg ${comboHighlight ?? ''}`;

  return (
    <>
      <main className='flex flex-col items-center lg:items-stretch lg:flex-row justify-center mt-20 mb-20 relative'>
        {phase === 'ended' && <ResultPage score={score} highestCombo={highestCombo} resetGame={resetGame} mistakeCount={mistakeCount} failedPuzzles={failedPuzzles}/>} 
        <section className='relative'>

          {/* Top bar (mobile) */}
          <div className='lg:hidden flex justify-between w-full px-2 text-white/50 text-lg min-[400px]:text-xl pb-1'>
            <h2 className='font-bold'>{score}</h2>
            <h2>{timerLabel}</h2>
          </div>

          {/* Always render the board; overlay will blur/block it during pre-game */}
          <div className='relative'>
            <PuzzleRushBrain
              puzzles={puzzles}
              sessionKey={sessionKey}
            orientation="white"
            onRight={onCorrect}
            onWrong={onWrong}
            onTurnChange={setSideToMove}
            className="max-w-[310px] min-[400px]:max-w-[350px] min-[410px]:max-w-[380px] min-[430px]:max-w-[390px] min-[400px]:mx-auto min-[500px]:max-w-[400px] sm:max-w-[480px] md:max-w-[520px] lg:max-w-[480px] xl:max-w-[550px] 2xl:max-w-[600px]"
          />

            {isPreGame && (
              <div
                className="lg:hidden absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-md select-none"
                // Block board interactions while countdown is active
                style={{ pointerEvents: 'auto' }}
              >
                <span className="text-white text-6xl font-black drop-shadow">
                  {preGameLabel}
                </span>
              </div>
            )}
          </div>

          {/* Blurry pre-game overlay (desktop) */}
          {isPreGame && (
            <div
              className="
                hidden lg:flex lg:absolute lg:inset-0 lg:items-center lg:justify-center lg:rounded-lg
                bg-black/50 backdrop-blur-md
                select-none
              "
              // Block any clicks until the game starts
              style={{ pointerEvents: 'auto' }}
            >
              <span className="text-white text-6xl font-black drop-shadow">
                {preGameLabel}
              </span>
            </div>
          )}

          <div className='lg:hidden text-white/50 pl-2 pt-2 text-lg'>
            {sideToMove === 'white' ? 'white to move' : 'black to move'}
          </div>
          <div className='lg:hidden w-full px-1 mt-8'>
            <p className='font-black'>Combo <span className={comboHighlightClass}>x{combo}</span></p>
          </div>
        </section>

        {/* Right panel (desktop) */}
        <section className='hidden lg:flex flex-col items-center rounded-xl bg-neutral-900 w-[300px] ml-4 xl:w-[340px] 2xl:w-[360px]'>
          <div className='w-full text-center bg-neutral-800 rounded-xl py-5 xl:py-6 2xl:py-7 font-medium'>
            <p className='text-lg xl:text-xl'>
              {sideToMove === 'white' ? 'White to move' : 'Black to move'}
            </p>
          </div>
          <div className='mt-5 flex justify-between items-center w-full px-5 text-xl xl:text-2xl 2xl:text-3xl text-white/50'>
            <h2 className='bg-neutral-800 py-2 px-6 rounded font-bold'>{score}</h2>
            <h2>{timerLabel}</h2>
          </div>
          <div className='w-full px-6 mt-15'>
            <p className='font-black'>Combo <span className={comboHighlightClass}>x{combo}</span></p>
          </div>
          <div className='mt-auto w-full flex justify-center gap-3 mb-5 px-3'>
            <button className='bg-neutral-800 w-1/2 py-2 xl:py-3 rounded cursor-pointer' onClick={resetGame}>reset</button>
            <Link href={"/daily"} className='w-1/2 py-2 xl:py-3 rounded bg-neutral-700 text-center'>Exit</Link>
          </div>
        </section>

        {/* Footer (mobile) */}
        <footer className='fixed bottom-0 w-full lg:hidden z-51'>
          <button className='bg-neutral-800 w-1/2 py-2 md:py-3 cursor-pointer' onClick={resetGame}>reset</button>
          <Link href={"/daily"} className='w-1/2 fixed py-2 md:py-3 bg-neutral-700 text-center'>Exit</Link>
        </footer>
      </main>
    </>
  );
}

function ResultPage({score = 0, highestCombo = 0, resetGame, mistakeCount = 0, failedPuzzles = []}) {
  return (
    <div className="absolute z-50 bg-neutral-900 w-[98%] rounded-xl lg:w-[800px] xl:w-[910px] 2xl:w-[980px] h-full py-5 lg:py-9 flex flex-col items-center">
    <h2 className="text-xl font-bold mb-5 sm:text-2xl lg:text-3xl lg:mb-8">TIMES UP!</h2>
    <article className="flex justify-center gap-2 sm:gap-5 sm:text-lg w-full">
      <div className="flex flex-col items-center w-[150px] sm:w-[200px] md:w-[250px] md:py-2 bg-gray-600 rounded py-1">
        <h3>Score</h3>
        <p className="font-bold">{score}</p>
      </div>
      <div className="flex flex-col items-center w-[150px] sm:w-[200px] md:w-[250px] md:py-2 bg-orange-600 rounded py-1">
        <h3>Highest Combo</h3>
        <p className="font-bold">{highestCombo}</p>
      </div>
    </article>
    <article className="flex justify-center gap-2 sm:gap-5 w-full mt-6">
      <button onClick={resetGame} className="cursor-pointer shadow-lg
            transition-all duration-300
            hover:shadow-2xl hover:-translate-y-1 w-[310px] sm:w-[420px] md:w-[520px] sm:py-5 sm:text-lg bg-teal-600 py-4 rounded">Play Again</button>
    </article>
    { mistakeCount > 0 &&  
    <article className="bg-zinc-800 mt-6 w-[310px] sm:w-[420px] md:w-[520px] rounded">
    <Link  href={{
    pathname: "/daily/review",
    query: {
      mistakes: mistakeCount,
      failed: JSON.stringify(failedPuzzles),
    },
  }} target="_blank" className="w-full">
      <h2 className="md:text-lg pt-4 pb-2 pl-4">Review your <strong>{mistakeCount}</strong> {mistakeCount === 1 ? "mistake" : "mistakes"}</h2>
      <p className="text-sm text-white/50 pl-4 pb-4">Don't worry, we'll open your mistakes in a new tab.<br/> You can <strong className="text-white/80">click this box</strong> and continue playing.</p>
      </Link>
    </article>}

    </div>
  )
}
