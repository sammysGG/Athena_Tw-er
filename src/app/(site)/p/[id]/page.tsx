import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostList from "@/app/components/feed/PostList";
import AppShell from "@/app/components/layout/AppShell";
import { FEED_POST_INCLUDE, serializePost } from "@/lib/feed-include";

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
    include: FEED_POST_INCLUDE,
  });
  if (!post) notFound();

  return (
    <AppShell>
      <h1 className="text-xl font-bold mb-4">Post</h1>
      <PostList initialPosts={[serializePost(post)]} />
    </AppShell>
  );
}
