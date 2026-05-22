import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const me = await requireUser();
    const saved = await prisma.savedPost.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      take: 100,
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
    const posts = saved.map((s) => s.post);
    return NextResponse.json({ posts });
  } catch (err) {
    return errorResponse(err);
  }
}
