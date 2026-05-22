import { NextResponse } from "next/server";
import { getCurrentUser, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const me = await getCurrentUser();
    if (!me) {
      return NextResponse.json({
        signedIn: false,
        likedPostIds: [],
        savedPostIds: [],
        followingUserIds: [],
      });
    }

    const [likes, saved, follows] = await Promise.all([
      prisma.like.findMany({ where: { userId: me.id }, select: { postId: true } }),
      prisma.savedPost.findMany({ where: { userId: me.id }, select: { postId: true } }),
      prisma.follow.findMany({
        where: { followerId: me.id },
        select: { followingId: true },
      }),
    ]);

    return NextResponse.json({
      signedIn: true,
      likedPostIds: likes.map((l) => l.postId),
      savedPostIds: saved.map((s) => s.postId),
      followingUserIds: follows.map((f) => f.followingId),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
