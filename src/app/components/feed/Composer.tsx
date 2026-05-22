"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Avatar from "./Avatar";
import EmojiPicker from "./EmojiPicker";
import { insertAtCursor } from "@/app/lib/insertAtCursor";

const MAX = 280;

export default function Composer({ onPosted }: { onPosted: () => void }) {
  const { data: session, status } = useSession();
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  if (status === "loading") {
    return (
      <div className="border border-gray-200 dark:border-white/10 rounded-xl p-4 h-32 animate-pulse bg-black/[0.02] dark:bg-white/[0.02]" />
    );
  }

  if (!session?.user) {
    return (
      <div className="border border-gray-200 dark:border-white/10 rounded-xl p-5 flex flex-wrap items-center justify-between gap-3 bg-black/[0.02] dark:bg-white/[0.02]">
        <p className="text-navyGray dark:text-white/70">
          Sign in to post, like and comment.
        </p>
        <div className="flex gap-2">
          <Link
            href="/sign-in"
            className="px-4 py-2 rounded-md border border-black dark:border-white font-medium hover:bg-black/5 dark:hover:bg-white/5"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 rounded-md bg-primary text-white font-medium hover:opacity-90"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "post");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = (await res.json()) as { url: string };
      setUploadedUrl(data.url);
      setMediaUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    const media = uploadedUrl ?? (mediaUrl.trim() || null);
    if (!text && !media) return;
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: text, mediaUrl: media }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post");
      }
      setContent("");
      setMediaUrl("");
      setUploadedUrl(null);
      if (fileRef.current) fileRef.current.value = "";
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX - content.length;
  const over = remaining < 0;
  const canSubmit =
    !submitting && !over && (content.trim().length > 0 || uploadedUrl || mediaUrl.trim());

  return (
    <form
      onSubmit={submit}
      className="border border-gray-200 dark:border-white/10 rounded-xl p-4 flex gap-3"
    >
      <Avatar
        name={session.user.name || session.user.email || "?"}
        src={(session.user as { image?: string | null }).image ?? null}
      />
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <textarea
          ref={textRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening? (paste a GIF/image/video URL or attach a file 👇)"
          rows={3}
          className="w-full resize-none bg-transparent outline-none text-base placeholder:text-navyGray/60 dark:placeholder:text-white/40"
          maxLength={MAX + 50}
        />

        {uploadedUrl ? (
          <div className="relative w-fit">
            {uploadedUrl.endsWith(".mp4") || uploadedUrl.endsWith(".webm") ? (
              <video src={uploadedUrl} className="max-h-48 rounded-md" controls />
            ) : (
              <img src={uploadedUrl} alt="upload preview" className="max-h-48 rounded-md" />
            )}
            <button
              type="button"
              onClick={() => setUploadedUrl(null)}
              className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-6 h-6 text-xs cursor-pointer"
              aria-label="Remove media"
            >
              ×
            </button>
          </div>
        ) : (
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="Paste an image, video, or YouTube URL (optional)"
            className="bg-transparent border border-gray-200 dark:border-white/15 rounded-md py-2 px-3 text-sm outline-none focus:border-primary"
          />
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center justify-between flex-wrap gap-2">
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
              className="text-primary text-sm font-medium hover:underline disabled:opacity-40 cursor-pointer"
            >
              {uploading ? "Uploading…" : "📎 Attach"}
            </button>
            <EmojiPicker
              onPick={(emoji) => {
                const { next, cursor } = insertAtCursor(textRef.current, emoji, content);
                setContent(next);
                requestAnimationFrame(() => {
                  textRef.current?.focus();
                  textRef.current?.setSelectionRange(cursor, cursor);
                });
              }}
            />
            <span
              className={`text-sm ${
                over ? "text-red-500" : "text-navyGray/60 dark:text-white/40"
              }`}
            >
              {remaining}
            </span>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
