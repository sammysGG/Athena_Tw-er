"use client";

import { useCallback, useEffect, useState } from "react";
import Composer from "./Composer";
import PostCard, { type FeedPost } from "./PostCard";
import { FeedSkeleton } from "@/app/components/ui/Skeleton";

export default function Feed() {
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/posts", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load feed");
      const data = (await res.json()) as { posts: FeedPost[] };
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <Composer onPosted={load} />
      {error && (
        <p className="text-sm text-red-500 border border-red-500/30 rounded-md px-4 py-2">
          {error}
        </p>
      )}
      {posts === null ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <p className="text-navyGray/60 dark:text-white/40 text-sm">
          No posts yet. Be the first to post something!
        </p>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} onChanged={load} />)
      )}
    </div>
  );
}
