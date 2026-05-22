"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useMeState } from "./MeStateProvider";

type Option = { id: string; text: string; _count: { votes: number } };

type Props = {
  postId: string;
  initialOptions: Option[];
  pollExpiresAt: string | null;
};

export default function PostPoll({ postId, initialOptions, pollExpiresAt }: Props) {
  const { data: session } = useSession();
  const me = useMeState();
  const [options, setOptions] = useState(initialOptions);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = options.reduce((n, o) => n + o._count.votes, 0);
  const expired = pollExpiresAt && new Date(pollExpiresAt).getTime() <= Date.now();
  const myOption = me.pollVotes.get(postId);
  const showResults = Boolean(myOption) || expired;

  const vote = async (optionId: string) => {
    if (!session?.user) {
      window.location.href = "/sign-in";
      return;
    }
    if (busy) return;
    if (expired) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Vote failed");
      }
      const data = (await res.json()) as {
        optionId: string;
        options: Option[];
        total: number;
      };
      setOptions(data.options);
      me.setVote(postId, data.optionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vote failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      {options.map((o) => {
        const pct = total > 0 ? Math.round((o._count.votes / total) * 100) : 0;
        const isMine = myOption === o.id;
        if (showResults) {
          return (
            <div
              key={o.id}
              className="relative border border-gray-200 dark:border-white/15 rounded-md overflow-hidden"
            >
              <div
                className={`absolute inset-y-0 left-0 ${
                  isMine ? "bg-primary/30" : "bg-primary/10"
                }`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="font-medium truncate">
                  {o.text}{isMine ? " ✓" : ""}
                </span>
                <span className="text-navyGray/70 dark:text-white/60">{pct}%</span>
              </div>
            </div>
          );
        }
        return (
          <button
            key={o.id}
            type="button"
            disabled={busy}
            onClick={() => vote(o.id)}
            className="border border-primary text-primary hover:bg-primary/10 rounded-md px-3 py-2 text-sm font-medium cursor-pointer disabled:opacity-60"
          >
            {o.text}
          </button>
        );
      })}
      <p className="text-xs text-navyGray/50 dark:text-white/40">
        {total} {total === 1 ? "vote" : "votes"}
        {pollExpiresAt && (
          <>
            {" · "}
            {expired
              ? "ended"
              : `ends ${new Date(pollExpiresAt).toLocaleString()}`}
          </>
        )}
      </p>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
