"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
const ChessBoardView = dynamic(() => import("@/app/components/ChessBoardView"), { ssr: false });
import clsx from "clsx";

const PRELOAD_FENS = [
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "r1bqk1nr/pppp1ppp/2n5/2b1p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 2 5",
  "r3k2r/ppp2ppp/2n1bn2/3qp3/3P4/2N1BN2/PPP2PPP/R2Q1RK1 w kq - 4 11",
  "3r2k1/1p3pp1/p1rqpb1p/2R5/3P1P2/PP3R1P/1B4PK/3Q4 w - - 0 26"
];

export default function ContentStepper({ title, content }) {
  const items = useMemo(() => Array.isArray(content) ? content : [], [content]);
  const [visibleCount, setVisibleCount] = useState(items.length > 0 ? 1 : 0);
  const [autoPlay, setAutoPlay] = useState(false);
  const containerRef = useRef(null);
  const paraRefs = useRef([]);
  const [voiceOn, setVoiceOn] = useState(false);
  const didMountRef = useRef(false);
  // Hydration-safe browser feature checks
  const [isHydrated, setIsHydrated] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const preloadFenRef = useRef(PRELOAD_FENS[Math.floor(Math.random() * PRELOAD_FENS.length)]);
  useEffect(() => {
    setIsHydrated(true);
    try {
      setTtsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    } catch {
      setTtsSupported(false);
    }
  }, []);

  // Manage header visibility when fullscreen toggles
  useEffect(() => {
    if (!isHydrated) return;
    const header = document.getElementById("browse-header");
    if (isFullscreen) {
      if (header) header.style.display = "none";
    } else {
      if (header) header.style.display = "";
    }
    return () => {
      if (header) header.style.display = "";
    };
  }, [isFullscreen, isHydrated]);

  useEffect(() => {
    if (!autoPlay) return;
    if (visibleCount >= items.length) return;
    // If voice is on, advance will be driven by speech end events
    if (voiceOn && ttsSupported) return;
    const id = setInterval(() => {
      setVisibleCount((c) => Math.min(c + 1, items.length));
    }, 2500);
    return () => clearInterval(id);
  }, [autoPlay, visibleCount, items.length, voiceOn, ttsSupported]);

  useEffect(() => {
    if (visibleCount >= items.length && autoPlay) {
      setAutoPlay(false);
    }
  }, [visibleCount, items.length, autoPlay]);

  const handleContinue = () => {
    setVisibleCount((c) => Math.min(c + 1, items.length));
  };

  const atEnd = visibleCount >= items.length;

  const adjustScrollForCurrentStep = () => {
    const idx = visibleCount - 1;
    if (idx < 0) return;
    const last = paraRefs.current[idx];
    if (!last) return;
    const behavior = "smooth";
    const isFenStep = last.dataset?.fen === "true";
    const fallbackScroll = () => {
      try {
        last.scrollIntoView({ behavior, block: "center" });
      } catch {
        last.scrollIntoView();
      }
    };
    const container = containerRef.current;
    if (!isFenStep || !container) {
      fallbackScroll();
      return;
    }
    const scrollToReveal = () => {
      const containerRect = container.getBoundingClientRect();
      const nodeRect = last.getBoundingClientRect();
      const bottomMargin = isFullscreen ? 120 : 96;
      const topMargin = 32;
      const overshoot = nodeRect.bottom + bottomMargin - containerRect.bottom;
      const undershoot = containerRect.top - (nodeRect.top - topMargin);
      let delta = 0;
      if (overshoot > 0) {
        delta = overshoot;
      } else if (undershoot > 0) {
        delta = -undershoot;
      }
      if (delta === 0) return;
      const maxScroll = container.scrollHeight - container.clientHeight;
      const target = Math.max(0, Math.min(container.scrollTop + delta, maxScroll));
      try {
        container.scrollTo({ top: target, behavior });
      } catch {
        container.scrollTop = target;
      }
    };
    const hasWindow = typeof window !== "undefined";
    let timeoutId;
    const runAdjustments = () => {
      scrollToReveal();
      if (hasWindow) {
        timeoutId = window.setTimeout(scrollToReveal, 160);
      }
    };
    let rafId;
    if (hasWindow && typeof window.requestAnimationFrame === "function") {
      rafId = window.requestAnimationFrame(runAdjustments);
    } else {
      runAdjustments();
    }
    return () => {
      if (hasWindow && timeoutId) window.clearTimeout(timeoutId);
      if (hasWindow && rafId && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(rafId);
      }
    };
  };

  // Auto-scroll to the most recently revealed paragraph (skip on initial mount)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    return adjustScrollForCurrentStep();
  }, [visibleCount]);

  useEffect(() => {
    if (!didMountRef.current) return;
    return adjustScrollForCurrentStep();
  }, [isFullscreen]);

  // Speak the current paragraph if voice mode is on (skip FEN)
  useEffect(() => {
    if (!ttsSupported) return;
    if (!voiceOn) {
      window.speechSynthesis.cancel();
      return;
    }
    const idx = visibleCount - 1;
    if (idx < 0 || idx >= items.length) return;
    const text = items[idx];
    if (!text) return;
    // If it's a FEN, don't read it out loud. If autoplay is on, skip ahead.
    if (isFen(text)) {
      if (autoPlay) {
        setVisibleCount((c) => Math.min(c + 1, items.length));
      }
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      utter.lang = "en-US";
      utter.onend = () => {
        // If autoplay is enabled and voice is still on, move to next paragraph
        if (autoPlay && voiceOn) {
          setVisibleCount((c) => Math.min(c + 1, items.length));
        }
      };
      window.speechSynthesis.speak(utter);
    } catch (e) {
      // ignore
    }
  }, [voiceOn, visibleCount, items, ttsSupported, autoPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ttsSupported) window.speechSynthesis.cancel();
    };
  }, [ttsSupported]);

  // Basic FEN detection
  const isFen = (text) => {
    if (typeof text !== "string") return false;
    const fen = text.trim();
    // six space-separated fields
    if (fen.split(/\s+/).length !== 6) return false;
    const FEN_RE = /^([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\s[wb]\s(K?Q?k?q?|-)\s([a-h][36]|-)\s\d+\s\d+$/;
    return FEN_RE.test(fen);
  };

  return (
    <section
      className={clsx(
        "relative flex flex-col items-center overflow-hidden bg-[#151515]",
        isFullscreen
          ? "fixed inset-0 z-50 w-screen h-screen m-0 rounded-none pt-5 md:pt-7"
          : "mt-7 w-[90%] ml-auto mr-auto py-8 lg:w-[950px] xl:w-[1150px] 2xl:w-[1300px] shadow-[6px_6px_1px_0_rgba(0,0,0,0.25)] xl:shadow-[8px_8px_1px_0_rgba(0,0,0,0.25)] h-[clamp(460px,72dvh,820px)] sm:h-[clamp(500px,70vh,820px)]"
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none opacity-0"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <ChessBoardView fen={preloadFenRef.current} />
      </div>
      {/* Fullscreen toggle button */}
      <button
        onClick={() => setIsFullscreen((v) => !v)}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        className="absolute top-2 right-2 bg-transparent text-white/80 hover:text-white text-sm md:text-base lg:text-lg px-1.5 py-1.5 md:px-2 md:py-2 lg:px-3 lg:py-2 rounded cursor-pointer"
      >
        {isFullscreen ? "exit full" : "[fullscreen]"}
      </button>
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-y-auto mt-2 px-6 md:px-24 xl:px-48 2xl:px-64 pb-36 cf-scroll"
      >
        <div className="space-y-12 md:space-y-14">
          <h1 className="text-xl lg:text-2xl font-black text-center">{title}</h1>
          <div className="flex items-center justify-center gap-3 relative bottom-6">
            <button
              onClick={() => setAutoPlay((v) => !v)}
              className={clsx(
                "w-40 py-2 rounded cursor-pointer font-semibold",
                autoPlay ? "bg-pink-700" : "bg-neutral-800"
              )}
            >
              {autoPlay ? "autoplay: on" : "autoplay"}
            </button>
            <button
              onClick={() => setVoiceOn((v) => !v)}
              disabled={isHydrated ? !ttsSupported : false}
              className={clsx(
                "w-40 py-2 rounded cursor-pointer font-semibold",
                voiceOn ? "bg-pink-700" : "bg-neutral-800",
                isHydrated && !ttsSupported && "opacity-50 cursor-not-allowed"
              )}
              title={isHydrated && !ttsSupported ? "Voice not supported in this browser" : undefined}
            >
              {voiceOn ? "voice: on" : "voice"}
            </button>
          </div>
          {items.slice(0, visibleCount).map((paragraph, index) => {
            const fenLike = isFen(paragraph);
            return (
              <div
                key={index}
                ref={(el) => (paraRefs.current[index] = el)}
                className="cf-snap-item"
                data-fen={fenLike ? "true" : undefined}
              >
                {fenLike ? (
                  <ChessBoardView fen={paragraph.trim()} className="my-6" />
                ) : (
                  <p className="leading-9 md:leading-loose">{paragraph}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <footer
        className="absolute bottom-0 left-0 right-0 bg-pink-700 text-white text-center px-5 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      >
        <button
          onClick={handleContinue}
          disabled={atEnd}
          className={clsx(
            "cursor-pointer w-full bg-pink-700 absolute left-0 bottom-0 py-4 font-bold",
            atEnd && "cursor-not-allowed"
          )}
        >
          {atEnd ? "done" : "continue"}
        </button>
      </footer>
      <style jsx>{`
        /* Firefox */
        .cf-scroll { 
          scrollbar-width: thin; 
          scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
          scroll-behavior: smooth;
          /* Allow normal scroll chaining and momentum */
          overscroll-behavior-y: auto;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
          scrollbar-gutter: stable both-edges;
        }
        /* WebKit */
        .cf-scroll::-webkit-scrollbar { width: 6px; }
        .cf-scroll::-webkit-scrollbar-track { background: transparent; }
        .cf-scroll::-webkit-scrollbar-thumb { 
          background-color: rgba(255, 255, 255, 0.25); 
          border-radius: 9999px; 
        }
        .cf-scroll::-webkit-scrollbar-thumb:hover { 
          background-color: rgba(255, 255, 255, 0.35); 
        }
        /* Removed scroll snapping for more natural scrolling */
      `}</style>
    </section>
  );
}