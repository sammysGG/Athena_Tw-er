import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Avatar from "@/app/components/feed/Avatar";
import AppShell from "@/app/components/layout/AppShell";
import SearchResults from "@/app/components/search/SearchResults";
import SearchBar from "@/app/components/layout/SearchBar";

export const metadata: Metadata = { title: "Explore | Tw@er" };
export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  // Suggested users: those with most posts (a tiny heuristic)
  const suggested = await prisma.user.findMany({
    orderBy: { posts: { _count: "desc" } },
    take: 5,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      role: true,
      _count: { select: { followers: true } },
    },
  });

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Explore</h1>
        <p className="text-navyGray/70 dark:text-white/60 mt-1">
          Search Tw@er and discover people to follow.
        </p>
      </div>

      <div className="mb-6">
        <Suspense fallback={<div className="h-9" />}>
          <SearchBar />
        </Suspense>
      </div>

      <section className="mb-8">
        <h2 className="font-semibold mb-3">People to follow</h2>
        <ul className="flex flex-col gap-3">
          {suggested.map((u) => (
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
                <p className="text-xs text-navyGray/50 dark:text-white/40 mt-1">
                  {u._count.followers} followers
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Suspense fallback={null}>
        <SearchResults />
      </Suspense>
    </AppShell>
  );
}
