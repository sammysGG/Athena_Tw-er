"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "@/app/components/feed/Avatar";
import EmojiPicker from "@/app/components/feed/EmojiPicker";
import MediaPreview from "@/app/components/feed/MediaPreview";
import { insertAtCursor } from "@/app/lib/insertAtCursor";
import { timeAgo } from "@/app/lib/format";

type Message = {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  senderId: string;
  receiverId: string;
  createdAt: string;
  readAt: string | null;
};

type Other = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role?: string;
  bio?: string | null;
};

type Me = { id: string; name: string | null; image: string | null };

const POLL_MS = 3000;

export default function ChatThread({ me, other }: { me: Me; other: Other }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/chats/${other.username}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Message[] };
      setMessages(data.messages);
      if (data.messages.length > 0) {
        lastIdRef.current = data.messages[data.messages.length - 1].id;
      }
    } catch {}
  }, [other.username]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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
      const res = await fetch(`/api/chats/${other.username}`, {
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
      <header className="flex items-center gap-3 border-b border-gray-200 dark:border-white/10 px-4 py-3">
        <Link href="/chat" className="text-sm text-navyGray/60 dark:text-white/50 hover:text-primary">
          ←
        </Link>
        <Link href={`/u/${other.username}`} className="flex items-center gap-3 hover:opacity-90">
          <Avatar name={other.displayName} src={other.avatarUrl} />
          <div>
            <div className="font-semibold flex items-center gap-2">
              {other.displayName}
              {other.role === "admin" && (
                <span className="text-[9px] uppercase bg-primary text-white px-1.5 py-0.5 rounded">
                  admin
                </span>
              )}
            </div>
            <div className="text-sm text-navyGray/60 dark:text-white/50">
              @{other.username}
            </div>
          </div>
        </Link>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-black/[0.01] dark:bg-white/[0.02]">
        {messages === null ? (
          <p className="text-sm text-navyGray/60 dark:text-white/40 self-center">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-navyGray/60 dark:text-white/40 self-center">
            No messages yet. Say hi 👋
          </p>
        ) : (
          messages.map((m) => {
            const fromMe = m.senderId === me.id;
            return (
              <div
                key={m.id}
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  fromMe
                    ? "bg-primary text-white self-end rounded-br-sm"
                    : "bg-black/[0.05] dark:bg-white/10 self-start rounded-bl-sm"
                }`}
              >
                {m.content && <p>{m.content}</p>}
                {m.mediaUrl && m.mediaType && (
                  <MediaPreview url={m.mediaUrl} type={m.mediaType} />
                )}
                <p
                  className={`text-[10px] mt-1 ${
                    fromMe ? "text-white/70" : "text-navyGray/50 dark:text-white/40"
                  }`}
                >
                  {timeAgo(m.createdAt)}
                </p>
              </div>
            );
          })
        )}
      </div>

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
            placeholder={`Message @${other.username}`}
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
    </div>
  );
}
