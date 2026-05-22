import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      gender: true,
      location: true,
      website: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      _count: { select: { posts: true, likes: true, comments: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({ user, posts });
}
