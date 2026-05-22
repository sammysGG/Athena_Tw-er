import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PostList from "@/app/components/feed/PostList";
import AppShell from "@/app/components/layout/AppShell";
import { FEED_POST_INCLUDE, serializePost } from "@/lib/feed-include";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ name: string }> }
): Promise<Metadata> {
  const { name } = await params;
  return { title: `#${name.toLowerCase()} | Tw@er` };
}

export default async function HashtagPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const tag = name.toLowerCase();
  // SQLite: case-insensitive LIKE by lowercasing both sides. We just match
  // '#tag' literally; we expect users to type `#foo` and find posts that
  // contain `#foo` in any case.
  const posts = await prisma.post.findMany({
    where: { content: { contains: `#${tag}` } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: FEED_POST_INCLUDE,
  });

  const serialized = posts.map(serializePost);

  const theme = TAG_THEMES[tag];

  return (
    <AppShell>
      <div
        className={`mb-6 rounded-xl border p-5 ${
          theme
            ? `${theme.border} ${theme.bg}`
            : "border-gray-200 dark:border-white/10 bg-transparent"
        }`}
      >
        <h1 className="text-3xl font-bold flex items-center gap-2">
          {theme?.flag && <span className="text-2xl">{theme.flag}</span>}
          <span>#{tag}</span>
        </h1>
        <p className={`mt-1 ${theme?.subtitle ?? "text-navyGray/70 dark:text-white/60"}`}>
          {theme?.tagline ?? `${posts.length} ${posts.length === 1 ? "post" : "posts"} tagged with #${tag}.`}
        </p>
      </div>
      {serialized.length === 0 ? (
        <p className="text-navyGray/60 dark:text-white/40">
          Nothing here yet. Be the first to post with #{tag}.
        </p>
      ) : (
        <PostList initialPosts={serialized} />
      )}
    </AppShell>
  );
}

const TAG_THEMES: Record<
  string,
  { border: string; bg: string; subtitle?: string; tagline?: string; flag?: string }
> = {
  nato: {
    border: "border-blue-500/50",
    bg: "bg-blue-500/5",
    subtitle: "text-blue-700 dark:text-blue-300",
    tagline: "Alliance posture, exercises, and analyst commentary.",
    flag: "🛡️",
  },
  donovia: {
    border: "border-red-500/50",
    bg: "bg-red-500/5",
    subtitle: "text-red-700 dark:text-red-300",
    tagline: "Donovian statements and state-aligned chatter.",
    flag: "🇩🇴",
  },
  estonia: {
    border: "border-sky-500/40",
    bg: "bg-sky-500/5",
    subtitle: "text-sky-700 dark:text-sky-300",
    flag: "🇪🇪",
  },
  cyber: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/5",
    subtitle: "text-emerald-700 dark:text-emerald-300",
    tagline: "Incidents, IOCs, and defender talk.",
    flag: "🛰️",
  },
};
