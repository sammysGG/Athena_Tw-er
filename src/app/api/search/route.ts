import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (!q) return NextResponse.json({ posts: [], users: [], q: "" });

  const [posts, users] = await Promise.all([
    prisma.post.findMany({
      where: { content: { contains: q } },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        role: true,
      },
    }),
  ]);

  return NextResponse.json({ posts, users, q });
}
