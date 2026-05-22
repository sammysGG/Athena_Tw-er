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

    const [likes, saved, follows, reposts, votes] = await Promise.all([
      prisma.like.findMany({ where: { userId: me.id }, select: { postId: true } }),
      prisma.savedPost.findMany({ where: { userId: me.id }, select: { postId: true } }),
      prisma.follow.findMany({
        where: { followerId: me.id },
        select: { followingId: true },
      }),
      prisma.repost.findMany({ where: { userId: me.id }, select: { postId: true } }),
      prisma.pollVote.findMany({
        where: { userId: me.id },
        select: { postId: true, optionId: true },
      }),
    ]);

    return NextResponse.json({
      signedIn: true,
      likedPostIds: likes.map((l) => l.postId),
      savedPostIds: saved.map((s) => s.postId),
      followingUserIds: follows.map((f) => f.followingId),
      repostedPostIds: reposts.map((r) => r.postId),
      pollVotes: Object.fromEntries(votes.map((v) => [v.postId, v.optionId])),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
