"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";

// SSR-safe board
const Chessboard = dynamic(
  () => import("react-chessboard").then((m) => m.Chessboard),
  { ssr: false }
);

export default function PuzzleRushBrain({
  puzzles,
  sessionKey,
  startIndex = 0,
  orientation = "white",
  className,
  onPuzzleAdvance,
  onSolve,
  onSkip,
  onRight,
  onWrong,
  onTurnChange
}) {
  const containerRef = useRef(null);
  const [boardSize, setBoardSize] = useState(320);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const count = Array.isArray(puzzles) ? puzzles.length : 0;
    return Math.min(Math.max(0, startIndex), Math.max(0, count - 1));
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [position, setPosition] = useState("");
  const [boardOrientation, setBoardOrientation] = useState(orientation);
  const gameRef = useRef(null);

  const shuffledPuzzles = useMemo(() => {
    if (!Array.isArray(puzzles)) return [];
    const copy = puzzles.map((seq) => (Array.isArray(seq) ? [...seq] : seq));
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [puzzles, sessionKey]);

  // compare only first 4 FEN fields (ignore halfmove/fullmove counters)
  const normalizeFen = useCallback((fen) => {
    return (fen || "").trim().split(/\s+/).slice(0, 4).join(" ");
  }, []);

  const activeSequence = useMemo(() => {
    const seq = shuffledPuzzles?.[currentIndex];
    if (!seq || !Array.isArray(seq) || seq.length === 0) return null;
    return seq;
  }, [shuffledPuzzles, currentIndex]);

  useEffect(() => {
    const count = shuffledPuzzles.length;
    if (count === 0) {
      setCurrentIndex(0);
      setStepIndex(0);
      return;
    }
    const desiredIndex = Math.min(Math.max(0, startIndex), Math.max(0, count - 1));
    setCurrentIndex((prev) => (prev === desiredIndex ? prev : desiredIndex));
    setStepIndex((prev) => (prev === 0 ? prev : 0));
  }, [shuffledPuzzles, startIndex]);

  // responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const w = el.offsetWidth || 320;
      setBoardSize(Math.max(240, Math.min(520, Math.floor(w))));
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // load given FEN into chess.js and set board
  const loadFen = useCallback((fen) => {
    try {
      const g = new Chess();
      const ok = g.load(fen);
      if (ok === false) throw new Error("Invalid FEN");
      gameRef.current = g;
      const nextOrientation = g.turn() === "b" ? "black" : "white";
      setPosition(g.fen());
      setBoardOrientation(nextOrientation);
      onTurnChange?.(nextOrientation);
    } catch {
      const g = new Chess();
      gameRef.current = g;
      const fallbackOrientation = orientation;
      setPosition(g.fen());
      setBoardOrientation(fallbackOrientation);
      onTurnChange?.(fallbackOrientation);
    }
  }, [onTurnChange, orientation]);

  const goToPuzzle = useCallback(
    (nextIndex) => {
      const count = shuffledPuzzles.length;
      if (count === 0) return;
      const bounded = (nextIndex + count) % count;
      setCurrentIndex(bounded);
      setStepIndex(0);
      const seq = shuffledPuzzles[bounded];
      if (seq && seq.length > 0) {
        loadFen(seq[0]);
      } else {
        const after = (bounded + 1) % count;
        setCurrentIndex(after);
        setStepIndex(0);
        if (shuffledPuzzles[after]?.[0]) loadFen(shuffledPuzzles[after][0]);
      }
      onPuzzleAdvance?.(bounded);
    },
    [loadFen, onPuzzleAdvance, shuffledPuzzles]
  );

  // initial load / when puzzle changes
  useEffect(() => {
    if (!activeSequence) return;
    const startFen = activeSequence[0];
    loadFen(startFen);
    setStepIndex(0);
  }, [activeSequence, loadFen]);

  // core logic: user move -> check against next expected FEN
  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }) => {
      const g = gameRef.current;
      const seq = activeSequence;
      if (!g || !seq) return false;

      const nextExpected = seq[stepIndex + 1];
      if (!nextExpected) {
        onSolve?.(currentIndex);
        goToPuzzle(currentIndex + 1);
        return true;
      }

      let moveOk = false;
      try {
        const move = g.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
        moveOk = !!move;
      } catch {
        moveOk = false;
      }

      if (!moveOk) {
        const currentFen = seq?.[stepIndex] ?? g.fen();
        loadFen(currentFen);
        return false;
      }

      const afterUserFen = g.fen();
      if (normalizeFen(afterUserFen) !== normalizeFen(nextExpected)) {
        onWrong?.({
        puzzleIndex: currentIndex,
        attemptedFen: afterUserFen,
        expectedFen: nextExpected,
        stepIndex,
        sequence: seq,
      });

        onSkip?.(currentIndex);
        goToPuzzle(currentIndex + 1);
        return false;
      }

      // user got this step right
      setPosition(afterUserFen);
      const nextStep = stepIndex + 1;

      // finished puzzle?
      if (nextStep === seq.length - 1) {
        onSolve?.(currentIndex);
        goToPuzzle(currentIndex + 1);
        onRight()
        return true;
      }

      // auto-play engine reply (the next FEN in the sequence)
      const engineReplyFen = seq[nextStep + 1];
      if (!engineReplyFen) {
        onSolve?.(currentIndex);
        goToPuzzle(currentIndex + 1);
        return true;
      }

      loadFen(engineReplyFen);
      setStepIndex(nextStep + 1);
      return true;
    },
    [
      activeSequence,
      currentIndex,
      goToPuzzle,
      loadFen,
      normalizeFen,
      onSkip,
      onSolve,
      stepIndex,
    ]
  );

  const canDragPiece = useCallback(({ piece }) => {
    const turn = gameRef.current?.turn?.();
    if (!turn || !piece?.pieceType) {
      return false;
    }
    const expectedPrefix = turn === "w" ? "w" : "b";
    return piece.pieceType.startsWith(expectedPrefix);
  }, []);

  // keep stepIndex sane if external changes happen
  useEffect(() => {
    if (!activeSequence) return;
    if (stepIndex < 0 || stepIndex >= activeSequence.length) {
      setStepIndex(0);
    }
  }, [activeSequence, stepIndex]);

  return (
    <div ref={containerRef} className={className}>
      {position && (
        <Chessboard
          key={`${sessionKey}-${currentIndex}`}
          boardWidth={boardSize}
          options={{
            id: "puzzle-rush-brain",
            position,
            boardOrientation,
            boardStyle: { borderRadius: 12 },
            darkSquareStyle: { backgroundColor: "#b58863" },
            lightSquareStyle: { backgroundColor: "#f0d9b5" },
            onPieceDrop: handlePieceDrop,
            canDragPiece,
            animationDurationInMs: stepIndex > 0 ? 200 : 0, // no tween for first frame
            showAnimations: stepIndex > 0,
          }}
        />
      )}
    </div>
  );
}
