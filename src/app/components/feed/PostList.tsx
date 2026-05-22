"use client";

import { useState } from "react";
import PostCard, { type FeedPost } from "./PostCard";

export default function PostList({ initialPosts }: { initialPosts: FeedPost[] }) {
  const [version, setVersion] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      {initialPosts.map((p) => (
        <PostCard key={`${p.id}-${version}`} post={p} onChanged={() => setVersion((v) => v + 1)} />
      ))}
    </div>
  );
}
