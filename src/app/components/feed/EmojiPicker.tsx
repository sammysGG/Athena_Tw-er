"use client";

import { useEffect, useRef, useState } from "react";

const EMOJIS: Record<string, string[]> = {
  Smileys: [
    "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃",
    "😉","😊","😇","🥰","😍","🤩","😘","😋","😎","🤓",
    "🤔","🤨","😐","😑","🙄","😒","😬","🤥","😴","😪",
    "🥱","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","😶‍🌫️",
    "😡","😠","🤬","😱","😨","😰","😥","😓","🤗","🤭",
  ],
  Gestures: [
    "👍","👎","👌","✌️","🤞","🤟","🤘","🤙","👈","👉",
    "👆","🖕","👇","☝️","👋","🤚","🖐️","✋","🖖","👏",
    "🙌","👐","🤲","🙏","✊","👊","🤛","🤜","💪","🫡",
  ],
  Hearts: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝"],
  Symbols: ["🔥","✨","🎉","💯","✅","❌","⚠️","🚨","🛑","📌","🎯","💡","💬","💭","🗣️","📣","📢","🆘","♻️","☢️"],
  Travel: ["✈️","🚢","🚀","🛳️","⛵","🚁","🛰️","🚆","🚓","🚑","🏥","🏛️","🏢","⛪","🏰","🗽","🗼","🌍","🌎","🌏"],
  Flags: ["🇪🇪","🇬🇧","🇺🇸","🇫🇷","🇩🇪","🇪🇺","🇺🇳","🏳️","🏴","🏳️‍🌈","🇨🇦","🇦🇺","🇸🇪","🇫🇮","🇱🇻","🇱🇹","🇵🇱","🇺🇦","🇳🇴","🇩🇰"],
};

type Props = {
  onPick: (emoji: string) => void;
};

export default function EmojiPicker({ onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<keyof typeof EMOJIS>("Smileys");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-base hover:opacity-80 cursor-pointer"
        aria-label="Insert emoji"
        title="Insert emoji"
      >
        😀
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-72 bg-white dark:bg-surfaceDark border border-gray-200 dark:border-white/10 rounded-xl shadow-lg p-2">
          <div className="flex gap-1 mb-2 overflow-x-auto border-b border-gray-100 dark:border-white/10 pb-2">
            {Object.keys(EMOJIS).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k as keyof typeof EMOJIS)}
                className={`text-xs px-2 py-1 rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                  tab === k
                    ? "bg-black/[0.06] dark:bg-white/10 text-navyGray dark:text-white font-semibold"
                    : "text-navyGray/60 dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-white/5"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-8 gap-0.5 max-h-44 overflow-y-auto">
            {EMOJIS[tab].map((e, i) => (
              <button
                key={`${e}-${i}`}
                type="button"
                onClick={() => {
                  onPick(e);
                  // keep picker open so people can stack emojis
                }}
                className="text-xl hover:bg-black/[0.04] dark:hover:bg-white/5 rounded-md cursor-pointer p-1"
                aria-label={`Insert ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
