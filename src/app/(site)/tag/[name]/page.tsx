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

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">#{tag}</h1>
        <p className="text-navyGray/70 dark:text-white/60 mt-1">
          {posts.length} {posts.length === 1 ? "post" : "posts"} tagged with #{tag}.
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
