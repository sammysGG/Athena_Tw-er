import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
    const [users, posts, totals] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          role: true,
          verifiedType: true,
          createdAt: true,
          avatarUrl: true,
          _count: { select: { posts: true, likes: true, comments: true, followers: true } },
        },
      }),
      prisma.post.findMany({
        orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
        take: 200,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              role: true,
              verifiedType: true,
            },
          },
          _count: { select: { likes: true, comments: true, reposts: true, views: true } },
        },
      }),
      Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.like.count(),
        prisma.comment.count(),
        prisma.chatMessage.count(),
        prisma.roomMessage.count(),
        prisma.post.count({ where: { scheduledFor: { gt: new Date() } } }),
      ]).then(([users, posts, likes, comments, dms, roomMsgs, scheduled]) => ({
        users,
        posts,
        likes,
        comments,
        dms,
        roomMsgs,
        scheduled,
      })),
    ]);
    return NextResponse.json({ users, posts, totals });
  } catch (err) {
    return errorResponse(err);
  }
}
