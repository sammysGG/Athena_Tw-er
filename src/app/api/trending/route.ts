import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const posts = await prisma.post.findMany({
    where: { createdAt: { gte: since } },
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
    take: 5,
    include: {
      author: { select: { username: true, displayName: true, avatarUrl: true, role: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({ posts });
}
