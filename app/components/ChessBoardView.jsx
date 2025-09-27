"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

// Dynamically import to avoid SSR issues in Next.js
const Chessboard = dynamic(
  () => import("react-chessboard").then((m) => m.Chessboard),
  { ssr: false }
);

export default function ChessBoardView({ fen, className }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState(360);

  // Make the board responsive to container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        // Keep the board square with sensible min/max, slightly smaller than container
        setSize(Math.max(260, Math.min(520, Math.floor(w * 0.9))));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <div className="flex items-center justify-center">
        <div style={{ width: size, height: size }}>
          <Chessboard
            options={{
              position: fen,
              allowDragging: false,
              boardStyle: { borderRadius: 8 },
              showAnimations: true,
              animationDurationInMs: 200,
            }}
          />
        </div>
      </div>
    </div>
  );
}
