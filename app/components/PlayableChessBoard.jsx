"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";

// Lazy-load the heavy board widget to keep SSR happy
const Chessboard = dynamic(
  () => import("react-chessboard").then((m) => m.Chessboard),
  { ssr: false }
);

export default function PlayableChessBoard({
  initialFen = "start",
  resetSignal = 0,
  className,
  orientation = "white",
  solutionFen,
  onCorrectMove,
  isFinalPosition = false,
  onFinalPositionShown,
}) {
  const gameRef = useRef(null);
  const [position, setPosition] = useState("");
  const [boardOrientation, setBoardOrientation] = useState(orientation);
  const containerRef = useRef(null);
  const [boardSize, setBoardSize] = useState(320); // Initial size
  const [isShaking, setIsShaking] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const shakeTimeoutRef = useRef(null);
  const resetTimeoutRef = useRef(null);
  const completionTimeoutRef = useRef(null);

  useEffect(() => {
    setBoardOrientation(orientation);
  }, [orientation]);

  useEffect(() => {
    const sanitizedFen = (initialFen || "start").trim();
    const game = new Chess();
    let loadSucceeded = true;

    if (sanitizedFen.toLowerCase() !== "start") {
      try {
        const result = game.load(sanitizedFen);
        loadSucceeded = result !== false;
      } catch (err) {
        loadSucceeded = false;
        console.warn("Invalid FEN provided to PlayableChessBoard:", err);
      }
    }

    if (!loadSucceeded) {
      console.warn(`Falling back to start position because FEN "${sanitizedFen}" could not be loaded.`);
      game.reset();
    }

    gameRef.current = game;
    setPosition(game.fen());
    // keep orientation stable; don't flip automatically on turn
  }, [initialFen, resetSignal]);

  // THIS useEffect is now using the sizing logic from your FIRST version
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const width = el.offsetWidth || 320;
      // Using the more flexible sizing from the first version
      setBoardSize(Math.max(240, Math.min(520, Math.floor(width))));
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }

    if (isFinalPosition) {
      setShowCompletion(true);
      completionTimeoutRef.current = setTimeout(() => {
        setShowCompletion(false);
        completionTimeoutRef.current = null;
        onFinalPositionShown?.();
      }, 2000);
    } else {
      setShowCompletion(false);
    }
  }, [isFinalPosition, onFinalPositionShown]);

  const triggerShake = useCallback(() => {
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    setIsShaking(true);
    shakeTimeoutRef.current = setTimeout(() => setIsShaking(false), 400);
  }, []);

  const resetToInitialPosition = useCallback(() => {
    const sanitizedInitial = (initialFen || "start").trim();
    const resetGame = new Chess();
    if (sanitizedInitial.toLowerCase() !== "start") {
      try {
        const loaded = resetGame.load(sanitizedInitial);
        if (loaded === false) {
          resetGame.reset();
        }
      } catch (err) {
        resetGame.reset();
      }
    }
    gameRef.current = resetGame;
    setPosition(resetGame.fen());
  }, [initialFen]);

  const normalizeFen = useCallback((fen) => {
    return (fen || "").trim().split(/\s+/).slice(0, 4).join(" ");
  }, []);

  const handlePieceDrop = useCallback(({ sourceSquare, targetSquare }) => {
    const game = gameRef.current;
    if (!game) return false;

    let move = null;
    try {
      move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
    } catch (err) {
      move = null;
    }

    if (!move) {
      triggerShake();
      resetToInitialPosition();
      return false;
    }
    setPosition(game.fen());

    if (solutionFen) {
      const currentFen = normalizeFen(game.fen());
      const targetFen = normalizeFen(solutionFen);
      if (currentFen !== targetFen) {
        triggerShake();
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = setTimeout(() => {
          resetToInitialPosition();
        }, 420);
      } else {
        onCorrectMove?.(targetFen);
        if (isFinalPosition && !showCompletion) {
          setShowCompletion(true);
          completionTimeoutRef.current = setTimeout(() => {
            setShowCompletion(false);
            onFinalPositionShown?.();
          }, 2000);
        }
      }
    }
    return true;
  }, [
    isFinalPosition,
    normalizeFen,
    onCorrectMove,
    onFinalPositionShown,
    resetToInitialPosition,
    showCompletion,
    solutionFen,
    triggerShake,
  ]);

  return (
    <>
      <div ref={containerRef} className={className}>
        {position && (
          <div
            className={`chessboard-frame${isShaking ? " shake" : ""}${showCompletion ? " complete" : ""}`}
          >
            <div className="board-inner">
              <Chessboard
                boardWidth={boardSize} // THIS is the sizing method from your FIRST version
                options={{
                  id: "daily-puzzle-board",
                  position,
                  boardOrientation,
                  // We removed width and height from here
                  boardStyle: { borderRadius: 12 },
                  darkSquareStyle: { backgroundColor: "#b58863" },
                  lightSquareStyle: { backgroundColor: "#f0d9b5" },
                  onPieceDrop: handlePieceDrop,
                  animationDurationInMs: 200,
                  showAnimations: true,
                }}
              />
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
    
        .chessboard-frame {
          position: relative;
          border-radius: 16px;
          padding: 4px;
          background: #111119;
          transition: transform 0.2s ease, box-shadow 0.4s ease;
        }
        .chessboard-frame::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 16px;
          border: 2px solid transparent;
          background: linear-gradient(#111119, #111119) padding-box,
            linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(52, 211, 153, 0.9)) border-box;
          opacity: 0;
          pointer-events: none;
        }
        .board-inner {
          position: relative;
          z-index: 1;
        }
        .chessboard-frame.complete {
          animation: board-complete-highlight 2s ease forwards;
        }
        .chessboard-frame.complete::after {
          animation: board-complete-border 2s ease forwards;
        }
        .chessboard-frame.shake {
          animation: chessboard-shake 0.4s ease;
        }
        .chessboard-frame.complete::before {
          content: "";
          position: absolute;
          inset: -6%;
          border-radius: 20px;
          background: radial-gradient(circle at center, rgba(52, 211, 153, 0.35), transparent 70%);
          opacity: 0;
          animation: board-complete-glow 2s ease forwards;
          pointer-events: none;
        }
        @keyframes chessboard-shake {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-8px);
          }
          40% {
            transform: translateX(8px);
          }
          60% {
            transform: translateX(-5px);
          }
          80% {
            transform: translateX(5px);
          }
          100% {
            transform: translateX(0);
          }
        }
        @keyframes board-complete-border {

          0% {

            opacity: 0;

            box-shadow: 0 0 0 rgba(52, 211, 153, 0);

          }

          20% {

            opacity: 1;

            box-shadow: 0 0 12px rgba(52, 211, 153, 0.35);

          }

          70% {

            opacity: 0.6;

            box-shadow: 0 0 18px rgba(52, 211, 153, 0.3);

          }

          100% {

            opacity: 0;

            box-shadow: 0 0 0 rgba(52, 211, 153, 0);

          }

        }


        @keyframes board-complete-highlight {
          0% {
            box-shadow: 0 0 0 rgba(52, 211, 153, 0);
           
          }
          20% {
            box-shadow: 0 0 20px rgba(52, 211, 153, 0.35);
            
          }
          60% {
            box-shadow: 0 0 30px rgba(52, 211, 153, 0.45);
            
          }
          100% {
            box-shadow: 0 0 16px rgba(52, 211, 153, 0.25);
            
          }
        }
        @keyframes board-complete-glow {
          0% {
            opacity: 0;
            
          }
          25% {
            opacity: 1;
          }
          70% {
            opacity: 0.55;
          }
          100% {
            opacity: 0;
            
          }
        }
      `}</style>
    </>
  );
}
