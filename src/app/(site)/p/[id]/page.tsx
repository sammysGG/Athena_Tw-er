import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostList from "@/app/components/feed/PostList";
import AppShell from "@/app/components/layout/AppShell";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: { content: true, author: { select: { username: true, displayName: true } } },
  });
  if (!post) return { title: "Post not found | Tw@er" };
  return {
    title: `${post.author.displayName} on Tw@er`,
    description: post.content.slice(0, 160),
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
      },
      pollOptions: {
        orderBy: { order: "asc" },
        include: { _count: { select: { votes: true } } },
      },
      _count: { select: { likes: true, comments: true, reposts: true, views: true } },
    },
  });
  if (!post) notFound();

  const serialized = [{
    ...post,
    createdAt: post.createdAt.toISOString(),
    pinnedAt: post.pinnedAt?.toISOString() ?? null,
    pollExpiresAt: post.pollExpiresAt?.toISOString() ?? null,
  }];

  return (
    <AppShell>
      <h1 className="text-xl font-bold mb-4">Post</h1>
      <PostList initialPosts={serialized} />
    </AppShell>
  );
}
