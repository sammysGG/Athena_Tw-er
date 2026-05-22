"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Avatar from "@/app/components/feed/Avatar";

type Props = {
  user: {
    id: string;
    username: string;
    displayName: string;
    bio: string;
    gender: string;
    location: string;
    website: string;
    avatarUrl: string | null;
  };
};

const GENDERS = [
  { value: "", label: "Prefer not to say" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "nonbinary", label: "Non-binary" },
  { value: "other", label: "Other" },
];

export default function SettingsForm({ user }: Props) {
  const { update } = useSession();
  const [form, setForm] = useState(user);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const change =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "avatar");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Upload failed");
      }
      const { url } = (await res.json()) as { url: string };
      setForm((p) => ({ ...p, avatarUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          bio: form.bio,
          gender: form.gender || null,
          location: form.location,
          website: form.website,
          avatarUrl: form.avatarUrl,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Save failed");
      }
      setMessage("Saved.");
      await update();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar name={form.displayName} src={form.avatarUrl} size={72} />
        <div>
          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-white/15 text-sm hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            {uploading ? "Uploading…" : "Change photo"}
          </button>
          {form.avatarUrl && (
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, avatarUrl: null }))}
              className="ml-2 text-sm text-navyGray/60 dark:text-white/50 hover:text-red-500 cursor-pointer"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <label className="text-sm">
        <span className="text-navyGray/80 dark:text-white/70">Username</span>
        <input value={form.username} disabled className="input-class mt-1 opacity-60" />
      </label>
      <label className="text-sm">
        <span className="text-navyGray/80 dark:text-white/70">Display name</span>
        <input
          value={form.displayName}
          onChange={change("displayName")}
          className="input-class mt-1"
          maxLength={50}
        />
      </label>
      <label className="text-sm">
        <span className="text-navyGray/80 dark:text-white/70">Bio</span>
        <textarea
          value={form.bio}
          onChange={change("bio")}
          className="input-class mt-1 resize-none"
          rows={3}
          maxLength={280}
        />
      </label>
      <label className="text-sm">
        <span className="text-navyGray/80 dark:text-white/70">Gender</span>
        <select value={form.gender} onChange={change("gender")} className="input-class mt-1">
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="text-navyGray/80 dark:text-white/70">Location</span>
        <input
          value={form.location}
          onChange={change("location")}
          className="input-class mt-1"
          maxLength={80}
        />
      </label>
      <label className="text-sm">
        <span className="text-navyGray/80 dark:text-white/70">Website</span>
        <input
          type="url"
          value={form.website}
          onChange={change("website")}
          className="input-class mt-1"
          placeholder="https://example.com"
        />
      </label>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {message && <p className="text-green-600 text-sm">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start px-5 py-2.5 rounded-md bg-primary text-white font-medium hover:opacity-90 disabled:opacity-60 cursor-pointer"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
