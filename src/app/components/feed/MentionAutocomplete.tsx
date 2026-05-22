"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

type UserHit = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
};

type TagHit = { tag: string; count: number };

type Trigger =
  | { kind: "@"; query: string; start: number; end: number }
  | { kind: "#"; query: string; start: number; end: number }
  | null;

function findTrigger(value: string, cursor: number): Trigger {
  // Scan backwards from cursor until whitespace, capture @x or #x.
  let i = cursor - 1;
  while (i >= 0) {
    const ch = value[i];
    if (/\s/.test(ch)) return null;
    if (ch === "@" || ch === "#") {
      const prev = i > 0 ? value[i - 1] : "";
      // Only treat as trigger if at start or preceded by whitespace —
      // prevents the `@` inside "Tw@er" from triggering.
      if (i !== 0 && !/\s/.test(prev)) return null;
      const query = value.slice(i + 1, cursor);
      // Trigger only on word characters
      if (!/^[a-zA-Z0-9_]*$/.test(query)) return null;
      return { kind: ch as "@" | "#", query, start: i, end: cursor };
    }
    if (!/[a-zA-Z0-9_]/.test(ch)) return null;
    i--;
  }
  return null;
}

export type AutocompleteApi = {
  /** Returns true if the keydown was handled by the autocomplete. */
  onKeyDown: (e: React.KeyboardEvent) => boolean;
  /** Called by the input on every change. */
  onChange: (value: string, cursor: number) => void;
};

type Props = {
  inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  value: string;
  setValue: (next: string) => void;
};

const MentionAutocomplete = forwardRef<AutocompleteApi, Props>(function MentionAutocomplete(
  { inputRef, value, setValue },
  ref
) {
  const [trigger, setTrigger] = useState<Trigger>(null);
  const [users, setUsers] = useState<UserHit[]>([]);
  const [tags, setTags] = useState<TagHit[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  type Item = {
    key: string;
    label: string;
    insert: string;
    sub?: string;
    avatarUrl?: string | null;
  };
  const items = useMemo<Item[]>(() => {
    if (!trigger) return [];
    if (trigger.kind === "@") {
      return users.map((u) => ({
        key: u.id,
        label: u.displayName,
        sub: `@${u.username}`,
        insert: `@${u.username}`,
        avatarUrl: u.avatarUrl,
      }));
    }
    return tags.map((t) => ({
      key: t.tag,
      label: `#${t.tag}`,
      sub: `${t.count} ${t.count === 1 ? "post" : "posts"}`,
      insert: `#${t.tag}`,
    }));
  }, [trigger, users, tags]);

  // Re-evaluate trigger when value changes (the parent updates value via onChange below).
  const recompute = useCallback(
    (val: string, cursor: number) => {
      const t = findTrigger(val, cursor);
      setTrigger(t);
      setActive(0);
    },
    []
  );

  // Fetch suggestions whenever trigger changes
  useEffect(() => {
    if (!trigger) {
      setUsers([]);
      setTags([]);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    const url =
      trigger.kind === "@"
        ? `/api/mentions?q=${encodeURIComponent(trigger.query)}`
        : `/api/hashtags?q=${encodeURIComponent(trigger.query)}`;
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (id !== reqId.current) return;
        if (trigger.kind === "@") setUsers(data.users ?? []);
        else setTags(data.tags ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [trigger]);

  const pick = useCallback(
    (idx: number) => {
      if (!trigger) return;
      const item = items[idx];
      if (!item) return;
      const before = value.slice(0, trigger.start);
      const afterStart = trigger.end;
      const after = value.slice(afterStart);
      // Insert with trailing space so the next char doesn't extend the token
      const insertion = `${item.insert} `;
      const next = before + insertion + after;
      setValue(next);
      // Restore caret right after the inserted token
      const cursor = (before + insertion).length;
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(cursor, cursor);
        }
      });
      setTrigger(null);
    },
    [items, setValue, trigger, value, inputRef]
  );

  useImperativeHandle(
    ref,
    () => ({
      onChange: recompute,
      onKeyDown: (e) => {
        if (!trigger || items.length === 0) return false;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActive((a) => (a + 1) % items.length);
          return true;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActive((a) => (a - 1 + items.length) % items.length);
          return true;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          pick(active);
          return true;
        }
        if (e.key === "Escape") {
          setTrigger(null);
          return true;
        }
        return false;
      },
    }),
    [trigger, items, active, pick, recompute]
  );

  if (!trigger || items.length === 0) {
    if (trigger && loading) {
      return (
        <div className="absolute left-0 top-full mt-1 z-40 bg-white dark:bg-surfaceDark border border-gray-200 dark:border-white/15 rounded-xl shadow-xl p-3 text-sm text-navyGray/60 dark:text-white/40">
          Searching…
        </div>
      );
    }
    return null;
  }

  return (
    <div className="absolute left-0 top-full mt-1 z-40 w-72 bg-white dark:bg-surfaceDark border border-gray-200 dark:border-white/15 rounded-xl shadow-xl overflow-hidden">
      <ul className="max-h-64 overflow-y-auto">
        {items.map((it, i) => (
          <li key={it.key}>
            <button
              type="button"
              onMouseDown={(e) => {
                // mousedown not click so the input doesn't blur first
                e.preventDefault();
                pick(i);
              }}
              onMouseEnter={() => setActive(i)}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm ${
                i === active
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
              }`}
            >
              {it.avatarUrl !== undefined && (
                it.avatarUrl ? (
                  <img src={it.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-semibold">
                    {it.label.charAt(0).toUpperCase()}
                  </span>
                )
              )}
              <span className="flex-1 truncate">
                <span className="font-medium">{it.label}</span>
                {it.sub && (
                  <span className="ml-2 text-navyGray/60 dark:text-white/40 text-xs">{it.sub}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default MentionAutocomplete;
