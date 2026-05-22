"use client";

import { useEffect, useState } from "react";

const SEQ = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export default function KonamiEgg() {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      // Ignore key presses inside text inputs so people typing "abba" don't trigger it
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      const got = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const expected = SEQ[idx];
      if (got === expected) {
        idx++;
        if (idx === SEQ.length) {
          setRevealed(true);
          idx = 0;
        }
      } else {
        idx = got === SEQ[0] ? 1 : 0;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!revealed) return null;

  return (
    <article className="relative overflow-hidden border border-red-500/40 bg-red-500/5 rounded-xl p-4">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(220,38,38,0.06) 0 8px, transparent 8px 16px)",
        }}
      />
      <p className="text-xs font-mono uppercase text-red-500 mb-2 tracking-widest">
        // [CLASSIFIED — REDACTED]
      </p>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-2xl shrink-0">
          🇩🇴
        </div>
        <div className="min-w-0">
          <p className="font-bold text-red-700 dark:text-red-400">
            ███████ has joined the conversation
          </p>
          <p className="text-xs text-red-500/80 mt-0.5 font-mono">@unknown · 00:00 UTC</p>
          <p className="mt-2 font-mono text-sm text-navyGray/80 dark:text-white/70">
            ████ ███████ ████ ██ █████ ██████ █████ ████ ████ █████.
            <br />
            ███ ████ ██████ █████ — ██████ ████.
          </p>
          <p className="text-xs text-red-500 mt-3 font-mono italic">
            // reload to dismiss
          </p>
        </div>
      </div>
    </article>
  );
}
