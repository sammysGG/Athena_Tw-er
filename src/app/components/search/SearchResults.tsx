"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Avatar from "@/app/components/feed/Avatar";
import PostCard, { type FeedPost } from "@/app/components/feed/PostCard";
import { FeedSkeleton, ChatListSkeleton } from "@/app/components/ui/Skeleton";

type UserHit = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
};

export default function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [data, setData] = useState<{ users: UserHit[]; posts: FeedPost[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setData({ users: d.users, posts: d.posts }))
      .catch(() => setData({ users: [], posts: [] }))
      .finally(() => setLoading(false));
  }, [q]);

  if (!q) {
    return (
      <p className="text-navyGray/60 dark:text-white/40">
        Type a query in the search bar to find posts and people.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-navyGray/70 dark:text-white/60">
        Results for <span className="font-semibold">“{q}”</span>
      </p>

      {loading && (
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="font-semibold mb-3">People</h2>
            <ChatListSkeleton count={2} />
          </section>
          <section>
            <h2 className="font-semibold mb-3">Posts</h2>
            <FeedSkeleton count={2} />
          </section>
        </div>
      )}

      {data && (
        <>
          <section>
            <h2 className="font-semibold mb-3">People ({data.users.length})</h2>
            {data.users.length === 0 ? (
              <p className="text-sm text-navyGray/60 dark:text-white/40">No matching users.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.users.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 border border-gray-200 dark:border-white/10 rounded-xl p-3"
                  >
                    <Link href={`/u/${u.username}`}>
                      <Avatar name={u.displayName} src={u.avatarUrl} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/u/${u.username}`}
                          className="font-semibold hover:underline"
                        >
                          {u.displayName}
                        </Link>
                        {u.role === "admin" && (
                          <span className="text-[9px] uppercase bg-primary text-white px-1.5 py-0.5 rounded">
                            admin
                          </span>
                        )}
                        <span className="text-sm text-navyGray/60 dark:text-white/40">
                          @{u.username}
                        </span>
                      </div>
                      {u.bio && (
                        <p className="text-sm text-navyGray/70 dark:text-white/60 line-clamp-2">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-semibold mb-3">Posts ({data.posts.length})</h2>
            {data.posts.length === 0 ? (
              <p className="text-sm text-navyGray/60 dark:text-white/40">No matching posts.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {data.posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
