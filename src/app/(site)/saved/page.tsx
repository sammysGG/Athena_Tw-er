import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PostList from "@/app/components/feed/PostList";
import AppShell from "@/app/components/layout/AppShell";

export const metadata: Metadata = { title: "Saved | Tw@er" };

export default async function SavedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/saved");

  const saved = await prisma.savedPost.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
          },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
  });

  const posts = saved.map((s) => ({
    ...s.post,
    createdAt: s.post.createdAt.toISOString(),
    pinnedAt: s.post.pinnedAt?.toISOString() ?? null,
  }));

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Saved</h1>
        <p className="text-navyGray/70 dark:text-white/60 mt-1">
          Posts you&apos;ve bookmarked for later.
        </p>
      </div>
      {posts.length === 0 ? (
        <p className="text-navyGray/60 dark:text-white/40">
          Nothing saved yet. Tap the bookmark icon on any post.
        </p>
      ) : (
        <PostList initialPosts={posts} />
      )}
    </AppShell>
  );
}
