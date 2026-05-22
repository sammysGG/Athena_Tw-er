"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Avatar from "./Avatar";

const MAX = 280;

export default function Composer({ onPosted }: { onPosted: () => void }) {
  const { data: session, status } = useSession();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post");
      }
      setContent("");
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX - content.length;
  const over = remaining < 0;

  return (
    <form
      onSubmit={submit}
      className="border border-gray-200 dark:border-white/10 rounded-xl p-4 flex gap-3"
    >
      <Avatar name={session.user.name || session.user.email || "?"} />
      <div className="flex-1 flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          rows={3}
          className="w-full resize-none bg-transparent outline-none text-base placeholder:text-navyGray/60 dark:placeholder:text-white/40"
          maxLength={MAX + 50}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex items-center justify-between">
          <span
            className={`text-sm ${
              over ? "text-red-500" : "text-navyGray/60 dark:text-white/40"
            }`}
          >
            {remaining}
          </span>
          <button
            type="submit"
            disabled={submitting || over || content.trim().length === 0}
            className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
