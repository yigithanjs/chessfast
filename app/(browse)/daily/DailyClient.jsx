"use client";
import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { exploreItems } from "@/app/lib/exploreItems";
import Link from "next/link";
import Footer from "../Footer";
import PlayableChessBoard from "@/app/components/PlayableChessBoard";

function hash(str) {
  // tiny stable hash (FNV-1a-ish)
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0; // unsigned
}

function todayKey(tz = "Europe/Istanbul") {
  const d = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d); // "YYYY-MM-DD"
  return parts;
}

export default function DailyClient() {
  const key = todayKey("Europe/Istanbul");
  const index = useMemo(() => hash(key) % exploreItems.length, [key]);
  const item = exploreItems[index];
  const upNext = useMemo(() => {
    const out = [];
    for (let i = 1; i <= 3 && i < exploreItems.length; i++) {
      out.push(exploreItems[(index + i) % exploreItems.length]);
    }
    return out;
  }, [index]);

  // Countdown to next lesson at midnight in Europe/Istanbul
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const secondsLeftInDayTZ = (tz) => {
      const now = new Date();
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).formatToParts(now);
      const get = (t) => Number(parts.find((p) => p.type === t)?.value || 0);
      const h = get("hour");
      const m = get("minute");
      const s = get("second");
      return 86400 - (h * 3600 + m * 60 + s);
    };

    const update = () => {
      const left = Math.max(0, secondsLeftInDayTZ("Europe/Istanbul"));
      const h = Math.floor(left / 3600);
      const m = Math.floor((left % 3600) / 60);
      const s = left % 60;
      setTimeLeft({ h, m, s });
    };

    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const nextText = useMemo(() => {
    const parts = [];
    if (timeLeft.h > 0) parts.push(`${timeLeft.h}h`);
    if (timeLeft.m > 0) parts.push(`${timeLeft.m}m`);
    parts.push(`${timeLeft.s}s`);
    return `Next in ${parts.join(" ")}`;
  }, [timeLeft]);
  const puzzleFens = useMemo(
    () => [
      "2r5/1pp2rkp/p2pnppq/8/2P1PP2/1P2N1QP/P4PK1/3RR3 w - - 5 27",
      "2r5/1pp2rkp/p2pnppq/5N2/2P1PP2/1P4QP/P4PK1/3RR3 b - - 6 27",
      "2r4k/1pp2r1p/p2pnppq/5N2/2P1PP2/1P4QP/P4PK1/3RR3 w - - 7 28",
      "2r4k/1pp2r1p/p2pnppN/8/2P1PP2/1P4QP/P4PK1/3RR3 b - - 0 28"
    ],
    []
  );
  const [resetSignal, setResetSignal] = useState(0);
  const [fenIndex, setFenIndex] = useState(0);
  const showAnswerTimeouts = useRef([]);
  const autoAdvanceTimeout = useRef(null);

  useEffect(() => {
    setFenIndex(0);
  }, [puzzleFens]);

  const clearTimers = useCallback(() => {
    showAnswerTimeouts.current.forEach((t) => clearTimeout(t));
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

  const handleReset = useCallback(() => {
    clearTimers();
    setFenIndex(0);
    setResetSignal((count) => count + 1);
  }, [clearTimers]);

  const handleShowAnswer = useCallback(() => {
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
  }, [clearTimers, puzzleFens]);

  const handleCorrectMove = useCallback(() => {
    setFenIndex((idx) => {
      const nextIndex = Math.min(idx + 1, puzzleFens.length - 1);

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

  const currentFen = puzzleFens[fenIndex] ?? puzzleFens[0];
  const nextFen = fenIndex < puzzleFens.length - 1 ? puzzleFens[fenIndex + 1] : undefined;
  const isFinalFen = fenIndex === puzzleFens.length - 1;

  return (
    <>
      <main className="w-[92%] lg:w-[950px] xl:w-[1150px] 2xl:w-[1300px] mx-auto pt-10 pb-28">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-medium  uppercase tracking-widest text-white/60">Daily Lesson</p>
          </div>
          <div className="text-white/70 text-sm md:text-base">{nextText}</div>
        </div>

        {/* Featured card */}
        <article
          className="relative rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.08)] px-6 py-7 md:px-10 md:py-9"
          style={{ backgroundImage: "linear-gradient(160deg, #9700c9ce 0%, #2e215aff 55%, #251a3bff 100%)" }}
        >
          <div className="flex gap-2 mb-5">
            <span className="px-2.5 py-1 rounded-full text-xs md:text-sm md:px-4 md:py-1.5 font-semibold bg-white/10 text-white/80">Mini-lesson</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-3">{item.title}</h2>
          {item.description && (
            <p className="text-white/85 text-base md:text-lg max-w-3xl mb-6">{item.description}</p>
          )}
          <div className="flex items-center gap-3">
            <Link href={`/explore/${item.slug}`} className="cursor-pointer">
              <button className="cursor-pointer px-5 py-2.5 md:px-6 md:py-3 rounded-xl bg-white/10 text-white font-semibold backdrop-blur-sm hover:bg-pink-600 hover:shadow-[3px_3px_0px_rgba(240,77,131,0.9)] transition-transform duration-200 hover:-translate-y-0.5 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="opacity-90">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Jump In
              </button>
            </Link>
          </div>

          {/* subtle vignette */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_300px_at_10%_-10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(600px_300px_at_90%_110%,rgba(0,0,0,0.35),transparent_60%)]" />
        </article>

        {/* Puzzle Rush and Daily Puzzle Section */}
        <section className="mt-[50px] flex flex-col xl:flex-row gap-15 relative w-full">
          <div>
            <h2 className="text-sm font-medium  uppercase tracking-widest text-white/60">CHESS CLASSICS RUSH</h2>
            <p className="text-sm md:text-base text-white/50 mt-2 mb-[40px]">Train your instincts with the most iconic positions every chess player should know.</p>
            <div className="md:flex xl:w-[700px] 2xl:w-[820px]">
              <article className="xl:h-[352px] 2xl:h-[380px] md:w-[50%] h-[280px] flex flex-col items-center justify-center gap-[35px] xl:gap-[60px] rounded-xl"
              style={{ background: "#54318bff "}}>
                <span className="text-3xl xl:text-4xl 2xl:text-5xl">🔥</span>
                <div className="text-center">
                  <h1 className="mb-4 text-lg font-md xl:text-xl 2xl:text-2xl font-bold">3 MINUTE BLITZ</h1>
                  <p className="px-10 text-white/70">3 minutes. Endless classics.</p>
                </div>
                
                <Link href={"daily/threeMinutesRush"} className="hover:bg-neutral-800 transition xl:py-3 xl:rounded-[100px] bg-neutral-950 w-[120px] xl:w-[150px] text-lg py-1 text-center rounded-2xl">Go</Link>
              </article>

              <article className="xl:h-[352px] 2xl:h-[380px] md:w-[50%] md:ml-5 mt-5 md:mt-0 h-[280px] flex flex-col items-center justify-center gap-[35px]  xl:gap-[60px] rounded-xl"
              style={{ background: "rgba(168, 32, 73, 1) "}}>
                <span className="text-3xl xl:text-4xl 2xl:text-5xl">🏕️</span>
                <div className="text-center">
                  <h1 className="mb-4 text-lg font-md xl:text-xl 2xl:text-2xl font-bold">SURVIVAL</h1>
                  <p className="px-10 text-white/70">20 iconic positions. One life</p>
                </div>
                <Link href={"daily/survival"} className="hover:bg-neutral-800 transition xl:py-3 xl:rounded-[100px] bg-neutral-950 w-[120px] xl:w-[150px] text-lg py-1 text-center rounded-2xl">Go</Link>
              </article>
            </div>
          </div>

          <div>
            <div className="flex flex-col justify-between xl:flex-row xl:items-center">
              <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-white/60 xl:mb-0">
                DAILY PUZZLE
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="cursor-pointer inline-flex items-center rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/75 transition hover:text-white hover:border-white/30"
                >
                  Reset
                </button>
                <button
                  onClick={handleShowAnswer}
                  className="cursor-pointer inline-flex items-center rounded-lg border border-pink-400/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-pink-200 transition hover:text-white hover:border-pink-300"
                >
                  Show Answer
                </button>
              </div>
            </div>

            <div style={{overflow: "hidden"}}>
              <PlayableChessBoard
                initialFen={currentFen}
                solutionFen={nextFen}
                onCorrectMove={handleCorrectMove}
                resetSignal={resetSignal}
                isFinalPosition={isFinalFen}
                className="mt-6 w-full md:max-w-[390px] lg:max-w-[460px] xl:max-w-[520px]"
              />
            </div>
          </div>
        </section>

      </main>
      <Footer active="daily" />
    </>
  );
}





