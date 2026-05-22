"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Avatar from "./Avatar";
import EmojiPicker from "./EmojiPicker";
import MediaPreview from "./MediaPreview";
import MentionAutocomplete, { type AutocompleteApi } from "./MentionAutocomplete";
import Tooltip from "@/app/components/ui/Tooltip";
import { PaperclipIcon, PollIcon, QuestionIcon } from "@/app/components/ui/Icons";
import { insertAtCursor } from "@/app/lib/insertAtCursor";
import { parseMediaUrl } from "@/lib/media";

const MAX = 280;

type Kind = "post" | "poll" | "question";

export default function Composer({ onPosted }: { onPosted: () => void }) {
  const { data: session, status } = useSession();
  const [content, setContent] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kind, setKind] = useState<Kind>("post");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDurationHours, setPollDurationHours] = useState<number>(24);

  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const acRef = useRef<AutocompleteApi>(null);

  // First http(s) URL in the post text (used for inline embed). Memoized
  // here at the top, before any early returns, to satisfy hook rules.
  const detectedMedia = useMemo(() => {
    const m = content.match(/(https?:\/\/[^\s<>()]+[^\s.,;:!?<>()'"])/);
    if (!m) return null;
    return parseMediaUrl(m[0]);
  }, [content]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const setPollOpt = (i: number, val: string) =>
    setPollOptions((p) => p.map((o, idx) => (idx === i ? val : o)));

  const reset = () => {
    setContent("");
    setUploadedUrl(null);
    setKind("post");
    setPollOptions(["", ""]);
    setPollDurationHours(24);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    const media = uploadedUrl ?? (detectedMedia?.url ?? null);
    if (kind === "poll") {
      const cleaned = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (cleaned.length < 2) {
        setError("Polls need at least 2 options");
        return;
      }
      if (!text) {
        setError("Add a question for your poll");
        return;
      }
    } else if (!text && !media) {
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content: text,
          mediaUrl: media,
          kind,
          pollOptions: kind === "poll" ? pollOptions.map((o) => o.trim()).filter(Boolean) : undefined,
          pollDurationHours: kind === "poll" ? pollDurationHours : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post");
      }
      reset();
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX - content.length;
  const over = remaining < 0;
  const canSubmit = !submitting && !over;

  const placeholder =
    kind === "poll"
      ? "Ask a question for your poll…"
      : kind === "question"
      ? "What do you want to ask Tw@er?"
      : "What's happening? Paste a link or attach a file 👇";

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
        <div className="flex items-center gap-1 text-xs">
          <KindButton current={kind} value="post" onPick={setKind} label="Post" />
          <KindButton current={kind} value="poll" onPick={setKind} label="Poll" icon={<PollIcon size={14} />} />
          <KindButton current={kind} value="question" onPick={setKind} label="Question" icon={<QuestionIcon size={14} />} />
          <span
            className={`ml-auto text-sm tabular-nums ${
              over ? "text-red-500" : "text-navyGray/60 dark:text-white/40"
            }`}
          >
            {remaining}
          </span>
        </div>

        <div className="relative">
          <textarea
            ref={textRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              acRef.current?.onChange(e.target.value, e.target.selectionStart ?? e.target.value.length);
            }}
            onKeyDown={(e) => {
              if (acRef.current?.onKeyDown(e)) return;
            }}
            onKeyUp={(e) => {
              const el = e.currentTarget;
              acRef.current?.onChange(el.value, el.selectionStart ?? el.value.length);
            }}
            onClick={(e) => {
              const el = e.currentTarget;
              acRef.current?.onChange(el.value, el.selectionStart ?? el.value.length);
            }}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-none bg-transparent outline-none text-base placeholder:text-navyGray/60 dark:placeholder:text-white/40"
            maxLength={MAX + 50}
          />
          <MentionAutocomplete
            ref={acRef}
            inputRef={textRef}
            value={content}
            setValue={setContent}
          />
        </div>

        {kind === "poll" && (
          <div className="border border-gray-200 dark:border-white/15 rounded-lg p-3 flex flex-col gap-2">
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={opt}
                  onChange={(e) => setPollOpt(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  maxLength={40}
                  className="input-class py-2 px-3 text-sm"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPollOptions((p) => p.filter((_, idx) => idx !== i))
                    }
                    className="text-navyGray/60 dark:text-white/40 hover:text-red-500 cursor-pointer text-sm"
                    title="Remove option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={() => setPollOptions((p) => [...p, ""])}
                className="self-start text-sm text-primary hover:underline cursor-pointer"
              >
                + Add option
              </button>
            )}
            <div className="flex items-center gap-2 mt-2 text-sm">
              <label className="text-navyGray/70 dark:text-white/60">Duration:</label>
              <select
                value={pollDurationHours}
                onChange={(e) => setPollDurationHours(Number(e.target.value))}
                className="rounded-md border border-gray-200 dark:border-white/15 bg-white text-navyGray dark:bg-surfaceDark dark:text-white py-1 px-2 text-sm outline-none"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>1 day</option>
                <option value={24 * 3}>3 days</option>
                <option value={24 * 7}>1 week</option>
              </select>
            </div>
          </div>
        )}

        {kind !== "poll" && uploadedUrl && (
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
        )}

        {kind !== "poll" && !uploadedUrl && detectedMedia && detectedMedia.type !== "link" && (
          <div>
            <MediaPreview url={detectedMedia.url} type={detectedMedia.type} />
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-navyGray/70 dark:text-white/70">
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
            <Tooltip label={uploading ? "Uploading…" : "Attach image, GIF or video"}>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || Boolean(uploadedUrl) || kind === "poll"}
                className="p-1.5 rounded-md hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current cursor-pointer disabled:cursor-not-allowed"
                aria-label="Attach"
              >
                <PaperclipIcon size={18} />
              </button>
            </Tooltip>
            <Tooltip label="Insert emoji">
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
            </Tooltip>
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

function KindButton({
  current,
  value,
  onPick,
  label,
  icon,
}: {
  current: Kind;
  value: Kind;
  onPick: (k: Kind) => void;
  label: string;
  icon?: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      className={`px-3 py-1 rounded-full flex items-center gap-1 font-medium cursor-pointer ${
        active
          ? "bg-primary text-white"
          : "bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/10"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
