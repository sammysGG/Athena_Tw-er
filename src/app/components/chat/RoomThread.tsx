"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Avatar from "@/app/components/feed/Avatar";
import EmojiPicker from "@/app/components/feed/EmojiPicker";
import MediaPreview from "@/app/components/feed/MediaPreview";
import RichText from "@/app/components/feed/RichText";
import { insertAtCursor } from "@/app/lib/insertAtCursor";
import { timeAgo } from "@/app/lib/format";

type RoomMessage = {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    role?: string;
  };
};

type RoomInfo = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createdBy: { id: string; username: string; displayName: string };
};

const POLL_MS = 3000;

export default function RoomThread({ room: initialRoom }: { room: RoomInfo }) {
  const { data: session } = useSession();
  const me = session?.user;
  const [room] = useState(initialRoom);
  const [messages, setMessages] = useState<RoomMessage[] | null>(null);
  const [text, setText] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${room.slug}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: RoomMessage[] };
      setMessages(data.messages);
    } catch {}
  }, [room.slug]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, [messages?.length]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "post");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Upload failed");
      }
      const { url } = (await res.json()) as { url: string };
      setUploadedUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t && !uploadedUrl) return;
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${room.slug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: t, mediaUrl: uploadedUrl }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Send failed");
      }
      setText("");
      setUploadedUrl(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
      <header className="border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center gap-3">
        <Link href="/chat" className="text-sm text-navyGray/60 dark:text-white/50 hover:text-primary">
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <div className="font-semibold">
            #{room.slug} <span className="text-sm font-normal text-navyGray/60 dark:text-white/50">— {room.name}</span>
          </div>
          {room.description && (
            <div className="text-sm text-navyGray/70 dark:text-white/60 truncate">
              {room.description}
            </div>
          )}
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-black/[0.01] dark:bg-white/[0.02]"
      >
        {messages === null ? (
          <p className="text-sm text-navyGray/60 dark:text-white/40 self-center">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-navyGray/60 dark:text-white/40 self-center">
            No messages in this room yet. Be the first 👋
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <Link href={`/u/${m.sender.username}`}>
                <Avatar name={m.sender.displayName} src={m.sender.avatarUrl} size={32} />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <Link
                    href={`/u/${m.sender.username}`}
                    className="font-semibold text-sm hover:underline"
                  >
                    {m.sender.displayName}
                  </Link>
                  {m.sender.role === "admin" && (
                    <span className="text-[9px] uppercase bg-primary text-white px-1 py-0.5 rounded">
                      admin
                    </span>
                  )}
                  <span className="text-xs text-navyGray/60 dark:text-white/40">
                    @{m.sender.username} · {timeAgo(m.createdAt)}
                  </span>
                </div>
                {m.content && (
                  <RichText
                    text={m.content}
                    className="text-sm whitespace-pre-wrap break-words"
                  />
                )}
                {m.mediaUrl && m.mediaType && (
                  <MediaPreview url={m.mediaUrl} type={m.mediaType} />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {me ? (
        <form
          onSubmit={send}
          className="border-t border-gray-200 dark:border-white/10 px-3 py-3 flex flex-col gap-2"
        >
          {uploadedUrl && (
            <div className="relative w-fit">
              {uploadedUrl.endsWith(".mp4") || uploadedUrl.endsWith(".webm") ? (
                <video src={uploadedUrl} className="max-h-28 rounded-md" controls />
              ) : (
                <img src={uploadedUrl} alt="preview" className="max-h-28 rounded-md" />
              )}
              <button
                type="button"
                onClick={() => setUploadedUrl(null)}
                className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full w-5 h-5 text-xs cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || Boolean(uploadedUrl)}
              className="text-primary text-sm font-medium hover:underline disabled:opacity-40 cursor-pointer shrink-0"
              title="Attach image, GIF or video"
            >
              {uploading ? "…" : "📎"}
            </button>
            <EmojiPicker
              onPick={(emoji) => {
                const { next, cursor } = insertAtCursor(inputRef.current, emoji, text);
                setText(next);
                requestAnimationFrame(() => {
                  inputRef.current?.focus();
                  inputRef.current?.setSelectionRange(cursor, cursor);
                });
              }}
            />
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Send to #${room.slug}`}
              maxLength={800}
              className="flex-1 rounded-full bg-black/[0.04] dark:bg-white/10 px-4 py-2 outline-none focus:bg-transparent focus:ring-2 focus:ring-primary/30 text-sm"
            />
            <button
              type="submit"
              disabled={sending || (!text.trim() && !uploadedUrl)}
              className="bg-primary text-white px-4 py-2 rounded-full font-semibold text-sm disabled:opacity-40 cursor-pointer"
            >
              Send
            </button>
          </div>
        </form>
      ) : (
        <p className="border-t border-gray-200 dark:border-white/10 p-4 text-sm text-navyGray/70 dark:text-white/60 text-center">
          <Link href="/sign-in" className="text-primary font-medium hover:underline">
            Sign in
          </Link>{" "}
          to chat in this room.
        </p>
      )}
    </div>
  );
}
