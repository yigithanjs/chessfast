"use client";
import { useMemo, useEffect, useState } from "react";
import { exploreItems } from "@/app/lib/exploreItems";
import Link from "next/link";
import Footer from "../Footer";

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

export default function Daily() {
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
            <span className="px-2.5 py-1 rounded-full text-xs md:text-sm md:px-4 md:py-1.5 font-semibold bg-white/10 text-white/90">Daily</span>
            <span className="px-2.5 py-1 rounded-full text-xs md:text-sm md:px-4 md:py-1.5 font-semibold bg-white/10 text-white/80">Mini‑lesson</span>
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

        {/* Up Next */}
        <div className="flex items-center justify-between mt-12 mb-4">
          <p className="text-sm font-medium tracking-widest uppercase text-white/60">Up Next</p>
          <Link href="/explore" className="text-white/70 text-sm hover:text-white">Explore all</Link>
        </div>
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upNext.map((it, i) => (
            <div
              key={it.slug}
              className="relative rounded-2xl overflow-hidden border border-white/10 p-5"
              style={{ backgroundImage: "linear-gradient(160deg, rgba(173, 9, 110, 0.87) 0%, rgba(202, 35, 118, 0.6) 55%, rgba(185, 17, 73, 0.6) 100%)" }}
            >
              {it.tags?.[0] && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 relative right-1">{it.tags[0]}</span>
              )}
              <h3 className="text-lg md:text-xl font-bold text-white mt-3 mb-6">{it.title}</h3>
              <Link href={`/explore/${it.slug}`} className="cursor-pointer text-white/90 hover:text-white font-medium">
                Start →
              </Link>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_90%_120%,rgba(0,0,0,0.35),transparent_60%)]" />
            </div>
          ))}
        </section>

        <p className="text-center text-white/50 text-sm mt-10">New lesson comes daily. Lessons are short, practical, and stack into habits.</p>
      </main>
      <Footer active="daily" />
    </>
  );
}
