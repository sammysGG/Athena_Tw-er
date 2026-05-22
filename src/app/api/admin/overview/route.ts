import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const [users, posts] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          role: true,
          createdAt: true,
          avatarUrl: true,
          _count: { select: { posts: true, likes: true, comments: true } },
        },
      }),
      prisma.post.findMany({
        orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
        take: 200,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true, role: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
    ]);
    return NextResponse.json({ users, posts });
  } catch (err) {
    return errorResponse(err);
  }
}
