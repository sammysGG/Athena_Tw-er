"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/app/components/feed/Avatar";
import VerifiedBadge from "@/app/components/feed/VerifiedBadge";
import { getTagTheme } from "@/lib/tag-themes";

type UserHit = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  verifiedType: string | null;
};

type TagHit = { tag: string; count: number };

type Item =
  | { kind: "user"; user: UserHit; href: string }
  | { kind: "tag"; tag: TagHit; href: string }
  | { kind: "search"; href: string; label: string };

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [users, setUsers] = useState<UserHit[]>([]);
  const [tags, setTags] = useState<TagHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  // Mirror the URL when this is the /search page
  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  // Debounced suggestion fetch
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 1) {
      setUsers([]);
      setTags([]);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, {
        cache: "no-store",
      })
        .then((r) => r.json())
        .then((d) => {
          if (id !== reqId.current) return;
          setUsers(d.users ?? []);
          setTags(d.tags ?? []);
        })
        .catch(() => {})
        .finally(() => {
          if (id === reqId.current) setLoading(false);
        });
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  const items = useMemo<Item[]>(() => {
    const trimmed = q.trim();
    if (!trimmed) return [];
    const out: Item[] = [];
    for (const u of users) {
      out.push({ kind: "user", user: u, href: `/u/${u.username}` });
    }
    for (const t of tags) {
      out.push({ kind: "tag", tag: t, href: `/tag/${t.tag}` });
    }
    out.push({
      kind: "search",
      href: `/search?q=${encodeURIComponent(trimmed)}`,
      label: `Search posts for "${trimmed}"`,
    });
    return out;
  }, [q, users, tags]);

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, items.length - 1)));
  }, [items.length]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative w-full max-w-sm" ref={wrapRef}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = q.trim();
          if (!trimmed) return;
          const item = items[active];
          if (item) go(item.href);
          else go(`/search?q=${encodeURIComponent(trimmed)}`);
        }}
      >
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (q.trim()) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (!open || items.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % items.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + items.length) % items.length);
            }
          }}
          placeholder="Search Tw@er — try @user or #tag"
          className="w-full rounded-full bg-black/[0.04] dark:bg-white/10 px-4 py-1.5 pr-9 text-sm outline-none focus:bg-transparent focus:ring-2 focus:ring-primary/30"
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-navyGray/60 dark:text-white/50 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </form>

      {open && q.trim() && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-surfaceDark border border-gray-200 dark:border-white/15 rounded-xl shadow-xl overflow-hidden">
          {loading && items.length === 0 ? (
            <p className="p-3 text-sm text-navyGray/60 dark:text-white/40">
              Searching…
            </p>
          ) : items.length === 0 ? (
            <p className="p-3 text-sm text-navyGray/60 dark:text-white/40">
              No matches.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {users.length > 0 && (
                <li className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-navyGray/50 dark:text-white/40">
                  People
                </li>
              )}
              {items.map((it, i) => {
                if (it.kind === "user") {
                  return (
                    <li key={`u-${it.user.id}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          go(it.href);
                        }}
                        onMouseEnter={() => setActive(i)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${
                          i === active
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                        }`}
                      >
                        <Avatar
                          name={it.user.displayName}
                          src={it.user.avatarUrl}
                          size={28}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="font-medium truncate flex items-center gap-1">
                            {it.user.displayName}
                            <VerifiedBadge type={it.user.verifiedType} />
                          </span>
                          <span className="text-xs text-navyGray/60 dark:text-white/40 truncate block">
                            @{it.user.username}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                }
                if (it.kind === "tag") {
                  const theme = getTagTheme(it.tag.tag);
                  if (i > 0 && items[i - 1].kind === "user") {
                    return (
                      <span key={`sep-${it.tag.tag}`}>
                        <li className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-navyGray/50 dark:text-white/40">
                          Tags
                        </li>
                        <li>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              go(it.href);
                            }}
                            onMouseEnter={() => setActive(i)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${
                              i === active
                                ? "bg-primary/10"
                                : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-md flex items-center justify-center font-bold ${
                                theme ? theme.link : "text-primary"
                              }`}
                            >
                              #
                            </span>
                            <span className="flex-1 min-w-0">
                              <span
                                className={`font-medium truncate block ${
                                  theme ? theme.link : ""
                                }`}
                              >
                                #{it.tag.tag}
                              </span>
                              <span className="text-xs text-navyGray/60 dark:text-white/40">
                                {it.tag.count}{" "}
                                {it.tag.count === 1 ? "post" : "posts"}
                              </span>
                            </span>
                          </button>
                        </li>
                      </span>
                    );
                  }
                  return (
                    <li key={`t-${it.tag.tag}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          go(it.href);
                        }}
                        onMouseEnter={() => setActive(i)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${
                          i === active
                            ? "bg-primary/10"
                            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-md flex items-center justify-center font-bold ${
                            theme ? theme.link : "text-primary"
                          }`}
                        >
                          #
                        </span>
                        <span className="flex-1 min-w-0">
                          <span
                            className={`font-medium truncate block ${
                              theme ? theme.link : ""
                            }`}
                          >
                            #{it.tag.tag}
                          </span>
                          <span className="text-xs text-navyGray/60 dark:text-white/40">
                            {it.tag.count}{" "}
                            {it.tag.count === 1 ? "post" : "posts"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                }
                // search
                return (
                  <li
                    key="search"
                    className="border-t border-gray-100 dark:border-white/10"
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        go(it.href);
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm ${
                        i === active
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-primary"
                      }`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                      <span className="font-medium truncate">{it.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
