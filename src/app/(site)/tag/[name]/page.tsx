import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PostList from "@/app/components/feed/PostList";
import AppShell from "@/app/components/layout/AppShell";
import { FEED_POST_INCLUDE, serializePost } from "@/lib/feed-include";
import { getTagTheme } from "@/lib/tag-themes";

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
  const posts = await prisma.post.findMany({
    where: { content: { contains: `#${tag}` } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: FEED_POST_INCLUDE,
  });

  const serialized = posts.map(serializePost);

  const theme = getTagTheme(tag);

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
          {theme?.tagline ??
            `${posts.length} ${posts.length === 1 ? "post" : "posts"} tagged with #${tag}.`}
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
