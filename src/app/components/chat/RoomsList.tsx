"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChatListSkeleton } from "@/app/components/ui/Skeleton";

type Room = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdBy: { username: string; displayName: string };
  _count: { messages: number };
};

export default function RoomsList() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/rooms", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { rooms: Room[] };
      setRooms(data.rooms);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed");
      }
      setForm({ name: "", description: "" });
      setCreating(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-navyGray/70 dark:text-white/60">
          Public chat rooms. Anyone signed in can post.
        </p>
        {session?.user && !creating && (
          <button
            onClick={() => setCreating(true)}
            className="text-sm bg-primary text-white px-3 py-1.5 rounded-md font-medium cursor-pointer hover:opacity-90"
          >
            + New room
          </button>
        )}
      </div>

      {creating && (
        <form
          onSubmit={create}
          className="border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col gap-3 mb-4"
        >
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Room name (e.g. estonia-news)"
            maxLength={40}
            className="input-class bg-white text-navyGray dark:bg-surfaceDark dark:text-white"
            autoFocus
          />
          <input
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description (optional)"
            maxLength={240}
            className="input-class bg-white text-navyGray dark:bg-surfaceDark dark:text-white"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || form.name.trim().length < 2}
              className="bg-primary text-white px-4 py-2 rounded-md font-medium cursor-pointer disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create room"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setError(null);
              }}
              className="px-4 py-2 rounded-md border border-gray-200 dark:border-white/15 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {rooms === null ? (
        <ChatListSkeleton />
      ) : rooms.length === 0 ? (
        <p className="text-navyGray/60 dark:text-white/40">
          No rooms yet. {session?.user ? "Be the first to create one." : "Sign in to create one."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rooms.map((r) => (
            <li key={r.id}>
              <Link
                href={`/chat/room/${r.slug}`}
                className="block border border-gray-200 dark:border-white/10 rounded-xl p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold">#{r.slug}</span>
                  <span className="text-sm text-navyGray/70 dark:text-white/60">— {r.name}</span>
                  <span className="ml-auto text-xs text-navyGray/50 dark:text-white/40">
                    {r._count.messages} messages
                  </span>
                </div>
                {r.description && (
                  <p className="text-sm text-navyGray/70 dark:text-white/60 mt-1">{r.description}</p>
                )}
                <p className="text-xs text-navyGray/50 dark:text-white/40 mt-1">
                  Created by{" "}
                  <Link href={`/u/${r.createdBy.username}`} className="hover:underline">
                    @{r.createdBy.username}
                  </Link>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
