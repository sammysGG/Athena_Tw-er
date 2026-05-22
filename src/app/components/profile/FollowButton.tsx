"use client";

import { useState } from "react";
import { useMeState } from "@/app/components/feed/MeStateProvider";

export default function FollowButton({ userId }: { userId: string }) {
  const me = useMeState();
  const [busy, setBusy] = useState(false);
  const following = me.followingUserIds.has(userId);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { following: boolean };
      me.setFollowing(userId, data.following);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`text-sm px-3 py-1.5 rounded-md font-medium cursor-pointer ${
        following
          ? "border border-gray-200 dark:border-white/15 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/40"
          : "bg-primary text-white hover:opacity-90"
      } disabled:opacity-60`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
