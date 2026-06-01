"use client";

import { useEffect, useRef, useState } from "react";

type Gif = {
  id: string;
  url: string;
  preview: string;
  description: string;
  dims: [number, number] | null;
};

type Props = {
  // Receives the meme image URL; chat composers store it as media.
  onPick: (url: string) => void;
};

export default function GifPicker({ onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on outside-click / Escape, same as EmojiPicker.
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

  useEffect(() => {
    if (open) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  // Debounced search; empty query returns the full template list.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      setError(null);
      setGifs(null);
      try {
        const res = await fetch(`/api/gifs?q=${encodeURIComponent(query.trim())}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "GIF search failed");
          setGifs([]);
          return;
        }
        setGifs(data.gifs ?? []);
      } catch {
        if (!cancelled) {
          setError("GIF search failed");
          setGifs([]);
        }
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] font-bold leading-none border border-current text-primary rounded px-1 py-0.5 hover:opacity-80 cursor-pointer shrink-0"
        aria-label="Insert meme"
        title="Insert meme"
      >
        MEME
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-72 bg-white dark:bg-surfaceDark border border-gray-200 dark:border-white/10 rounded-xl shadow-lg p-2">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memes…"
            className="w-full rounded-lg bg-black/[0.04] dark:bg-white/10 px-3 py-1.5 mb-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="max-h-56 overflow-y-auto">
            {gifs === null ? (
              <p className="text-xs text-navyGray/60 dark:text-white/40 text-center py-6">
                Loading…
              </p>
            ) : error ? (
              <p className="text-xs text-red-500 text-center py-6 px-2">{error}</p>
            ) : gifs.length === 0 ? (
              <p className="text-xs text-navyGray/60 dark:text-white/40 text-center py-6">
                No memes found.
              </p>
            ) : (
              <div className="columns-2 gap-1">
                {gifs.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      onPick(g.url);
                      setOpen(false);
                    }}
                    className="mb-1 w-full block overflow-hidden rounded-md hover:ring-2 hover:ring-primary cursor-pointer"
                    title={g.description}
                  >
                    <img
                      src={g.preview}
                      alt={g.description}
                      loading="lazy"
                      className="w-full h-auto block"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-[10px] text-navyGray/40 dark:text-white/30 text-center pt-1.5">
            Memes via Imgflip
          </p>
        </div>
      )}
    </div>
  );
}
