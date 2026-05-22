"use client";

import { useMemo, useRef, useState } from "react";
import Avatar from "@/app/components/feed/Avatar";
import VerifiedBadge from "@/app/components/feed/VerifiedBadge";
import EmojiPicker from "@/app/components/feed/EmojiPicker";
import MediaPreview from "@/app/components/feed/MediaPreview";
import { POST_LABEL_OPTIONS } from "@/app/components/feed/PostLabel";
import { PaperclipIcon } from "@/app/components/ui/Icons";
import { insertAtCursor } from "@/app/lib/insertAtCursor";
import { parseMediaUrl } from "@/lib/media";

type UserOption = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  verifiedType: string | null;
};

export default function InjectComposer({
  users,
  onPosted,
}: {
  users: UserOption[];
  onPosted: () => void;
}) {
  const sorted = useMemo(
    () => [...users].sort((a, b) => a.username.localeCompare(b.username)),
    [users]
  );

  const [authorId, setAuthorId] = useState(sorted[0]?.id ?? "");
  const [content, setContent] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string>(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const detectedMedia = useMemo(() => {
    const m = content.match(/(https?:\/\/[^\s<>()]+[^\s.,;:!?<>()'"])/);
    if (!m) return null;
    return parseMediaUrl(m[0]);
  }, [content]);

  const author = sorted.find((u) => u.id === authorId);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "post");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Upload failed");
      }
      const data = (await res.json()) as { url: string };
      setUploadedUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorId) {
      setError("Pick an author");
      return;
    }
    const text = content.trim();
    const media = uploadedUrl ?? detectedMedia?.url ?? null;
    if (!text && !media) {
      setError("Add some text or media");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/inject", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          authorId,
          content: text,
          mediaUrl: media,
          label: label || null,
          scheduledFor: scheduleEnabled
            ? new Date(scheduledFor).toISOString()
            : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Inject failed");
      }
      setContent("");
      setUploadedUrl(null);
      setLabel("");
      if (fileRef.current) fileRef.current.value = "";
      setSuccess(
        scheduleEnabled
          ? `Scheduled inject for @${author?.username} at ${new Date(scheduledFor).toLocaleString()}.`
          : `Posted as @${author?.username}.`
      );
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inject failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="border border-amber-500/40 bg-amber-500/[0.04] rounded-xl p-4 flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">⚡</span>
        <div>
          <h3 className="font-semibold">Scenario inject</h3>
          <p className="text-xs text-navyGray/70 dark:text-white/60">
            Post as any user, optionally with a banner label and/or a scheduled
            drop time. Recorded in the audit trail as injected by you.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-3">
        <label className="text-sm">
          <span className="text-navyGray/80 dark:text-white/70">Post as</span>
          <select
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            className="input-class mt-1 bg-white text-navyGray dark:bg-surfaceDark dark:text-white"
          >
            {sorted.map((u) => (
              <option key={u.id} value={u.id}>
                @{u.username} — {u.displayName}
                {u.verifiedType ? ` · ${u.verifiedType}` : ""}
                {u.role === "admin" ? " · admin" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="text-navyGray/80 dark:text-white/70">Banner label</span>
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input-class mt-1 bg-white text-navyGray dark:bg-surfaceDark dark:text-white"
          >
            <option value="">— none —</option>
            {POST_LABEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {author && (
        <div className="border border-gray-200 dark:border-white/10 rounded-lg p-3 flex gap-3">
          <Avatar name={author.displayName} src={author.avatarUrl} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <span className="font-semibold">{author.displayName}</span>
              <span className="text-navyGray/60 dark:text-white/40">
                @{author.username}
              </span>
              <VerifiedBadge type={author.verifiedType} />
              {author.role === "admin" && (
                <span className="text-[10px] uppercase tracking-wider bg-primary text-white px-1.5 py-0.5 rounded">
                  admin
                </span>
              )}
            </div>
            <textarea
              ref={textRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What does @${author.username} say?`}
              rows={3}
              maxLength={330}
              className="w-full mt-2 resize-none bg-transparent outline-none text-base placeholder:text-navyGray/60 dark:placeholder:text-white/40"
            />
            {uploadedUrl ? (
              <div className="relative w-fit">
                {uploadedUrl.endsWith(".mp4") || uploadedUrl.endsWith(".webm") ? (
                  <video src={uploadedUrl} className="max-h-48 rounded-md" controls />
                ) : (
                  <img src={uploadedUrl} alt="preview" className="max-h-48 rounded-md" />
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
            ) : detectedMedia && detectedMedia.type !== "link" ? (
              <MediaPreview url={detectedMedia.url} type={detectedMedia.type} />
            ) : null}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap text-sm">
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
          className="p-1.5 rounded-md hover:bg-primary/10 hover:text-primary disabled:opacity-30 cursor-pointer"
          aria-label="Attach"
          title={uploading ? "Uploading…" : "Attach image/video"}
        >
          <PaperclipIcon size={18} />
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={scheduleEnabled}
            onChange={(e) => setScheduleEnabled(e.target.checked)}
          />
          <span>Schedule for later</span>
        </label>
        {scheduleEnabled && (
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="rounded-md border border-gray-200 dark:border-white/15 bg-white text-navyGray dark:bg-surfaceDark dark:text-white py-1 px-2 text-sm outline-none"
          />
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-md bg-amber-500 text-white font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {submitting
            ? "Injecting…"
            : scheduleEnabled
            ? "Schedule inject"
            : "Post inject"}
        </button>
      </div>
    </form>
  );
}
