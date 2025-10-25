"use client";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PlayableChessBoard from "@/app/components/PlayableChessBoard";

function safeJSON(paramValue, fallback) {
  if (!paramValue) return fallback;
  try {
    return JSON.parse(paramValue);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(paramValue));
    } catch {
      return fallback;
    }
  }
}

export default function ReviewPageComp() {
  const params = useSearchParams();
  const failedParam = params.get("failed");
  const failures = useMemo(() => {
    const parsed = safeJSON(failedParam, []);
    return Array.isArray(parsed) ? parsed : [];
  }, [failedParam]);

  const [selectedPuzzle, setSelectedPuzzle] = useState(0);
  const [fenIndex, setFenIndex] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const showAnswerTimeouts = useRef([]);
  const autoAdvanceTimeout = useRef(null);

  const clearTimers = useCallback(() => {
    showAnswerTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    showAnswerTimeouts.current = [];
    if (autoAdvanceTimeout.current) {
      clearTimeout(autoAdvanceTimeout.current);
      autoAdvanceTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (selectedPuzzle >= failures.length) {
      setSelectedPuzzle((prev) => (failures.length === 0 ? 0 : Math.min(prev, failures.length - 1)));
    }
  }, [failures.length, selectedPuzzle]);

  const selectedFailure = failures[selectedPuzzle] ?? null;

  const puzzleFens = useMemo(() => {
    if (!selectedFailure) return [];
    if (Array.isArray(selectedFailure.sequence) && selectedFailure.sequence.length > 0) {
      return selectedFailure.sequence;
    }
    const fallback = [];
    if (selectedFailure.attemptedFen) {
      fallback.push(selectedFailure.attemptedFen);
    }
    if (
      selectedFailure.expectedFen &&
      selectedFailure.expectedFen !== selectedFailure.attemptedFen
    ) {
      fallback.push(selectedFailure.expectedFen);
    }
    return fallback;
  }, [selectedFailure]);

  useEffect(() => {
    clearTimers();
    setFenIndex(0);
    setResetSignal((count) => count + 1);
  }, [clearTimers, puzzleFens, selectedPuzzle]);

  const handleReset = useCallback(() => {
    clearTimers();
    setFenIndex(0);
    setResetSignal((count) => count + 1);
  }, [clearTimers]);

  const handleShowAnswer = useCallback(() => {
    if (puzzleFens.length <= 1) {
      handleReset();
      return;
    }

    clearTimers();
    setFenIndex(0);
    setResetSignal((count) => count + 1);

    puzzleFens.forEach((_, idx) => {
      if (idx === 0) return;
      const timeout = setTimeout(() => {
        setFenIndex(idx);
        setResetSignal((count) => count + 1);
      }, idx * 400);
      showAnswerTimeouts.current.push(timeout);
    });
  }, [clearTimers, handleReset, puzzleFens]);

  const handleCorrectMove = useCallback(() => {
    setFenIndex((idx) => {
      const nextIndex = Math.min(idx + 1, Math.max(puzzleFens.length - 1, 0));

      if (autoAdvanceTimeout.current) {
        clearTimeout(autoAdvanceTimeout.current);
        autoAdvanceTimeout.current = null;
      }

      const opponentIndex = nextIndex + 1;
      if (opponentIndex < puzzleFens.length) {
        autoAdvanceTimeout.current = setTimeout(() => {
          setFenIndex(opponentIndex);
          autoAdvanceTimeout.current = null;
        }, 400);
      }

      return nextIndex;
    });
  }, [puzzleFens.length]);

  if (failures.length === 0) {
    return (
      <main className="flex h-[70vh] flex-col items-center justify-center text-center text-white/70">
        <h1 className="text-2xl font-semibold">Nothing to review!</h1>
        <p className="mt-2 text-sm">
          Finish a blitz run with at least one mistake to unlock the review board.
        </p>
      </main>
    );
  }

  const baseFenForOrientation =
    puzzleFens[0] ||
    selectedFailure?.attemptedFen ||
    selectedFailure?.expectedFen ||
    "start";
  const boardOrientation = useMemo(() => {
    const parts = baseFenForOrientation.split(/\s+/);
    return parts[1] === "b" ? "black" : "white";
  }, [baseFenForOrientation]);
  const currentFen =
    puzzleFens[fenIndex] ||
    selectedFailure?.attemptedFen ||
    selectedFailure?.expectedFen ||
    "start";
  const nextFen =
    fenIndex < puzzleFens.length - 1 ? puzzleFens[fenIndex + 1] : undefined;
  const isFinalFen = puzzleFens.length > 0 && fenIndex === puzzleFens.length - 1;

  return (
    <main className="mx-auto flex w-[95%] max-w-[1200px] flex-col gap-10 py-10 lg:flex-row 2xl:relative 2xl:right-20">
      <section className="mx-auto w-full max-w-[320px] rounded-xl bg-neutral-900 px-4 py-5 text-white lg:mx-0 lg:w-[290px] relative xl:left-7">
        <h2 className="text-lg font-semibold">Failed Puzzles</h2>
        <p className="mt-1 text-sm text-white/50">
          Select a puzzle to replay the correct line.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {failures.map((_, index) => {
            const isActive = index === selectedPuzzle;
            return (
              <button
                key={`${index}-${failures[index]?.puzzleIndex ?? "puzzle"}`}
                type="button"
                onClick={() => setSelectedPuzzle(index)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left transition cursor-pointer ${
                  isActive
                    ? "bg-purple-600/30 text-white"
                    : "bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                <span>Question {index + 1}</span>
                {failures[index]?.puzzleIndex !== undefined && (
                  <span className="text-xs text-white/40">
                    #{failures[index].puzzleIndex + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex-1 rounded-xl bg-neutral-950 px-4 py-5 text-white shadow-lg sm:px-6 lg:px-8 xl:relative xl:bottom-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between max-w-[96%] min-[400px]:max-w-[92%] lg:max-w-[600px] min-[500px]:max-w-[460px] md:max-w-[520px] ml-auto mr-auto">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/40">
              Reviewing
            </p>
            <h1 className="text-2xl font-semibold">
              Question {selectedPuzzle + 1}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="inline-flex cursor-pointer items-center rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/75 transition hover:border-white/30 hover:text-white"
            >
              Reset
            </button>
            <button
              onClick={handleShowAnswer}
              className="inline-flex cursor-pointer items-center rounded-lg border border-pink-400/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-pink-200 transition hover:border-pink-300 hover:text-white"
            >
              Show Answer
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden">
          <PlayableChessBoard
            orientation={boardOrientation}
            initialFen={currentFen}
            solutionFen={nextFen}
            onCorrectMove={handleCorrectMove}
            resetSignal={resetSignal}
            isFinalPosition={isFinalFen}
            className="ml-auto mr-auto max-w-[96%] min-[400px]:max-w-[92%] min-[500px]:max-w-[460px] md:max-w-[520px] lg:max-w-[600px]"
          />
        </div>
      </section>
    </main>
  );
}
