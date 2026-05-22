import type { Prisma } from "@prisma/client";

export const FEED_POST_INCLUDE = {
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
  pollOptions: {
    orderBy: { order: "asc" as const },
    include: { _count: { select: { votes: true } } },
  },
} satisfies Prisma.PostInclude;

type RawPost = Prisma.PostGetPayload<{ include: typeof FEED_POST_INCLUDE }>;

export type SerializedFeedPost = Omit<
  RawPost,
  "createdAt" | "pinnedAt" | "pollExpiresAt" | "scheduledFor" | "pollOptions"
> & {
  createdAt: string;
  pinnedAt: string | null;
  pollExpiresAt: string | null;
  scheduledFor: string | null;
  pollOptions: Array<Omit<RawPost["pollOptions"][number], "post">>;
};

export function serializePost(p: RawPost): SerializedFeedPost {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    pinnedAt: p.pinnedAt?.toISOString() ?? null,
    pollExpiresAt: p.pollExpiresAt?.toISOString() ?? null,
    scheduledFor: p.scheduledFor?.toISOString() ?? null,
  } as SerializedFeedPost;
}

/**
 * Hide scheduled-future posts from non-admin viewers, but keep them
 * visible to admins for preview/management.
 */
export function visiblePostsWhere(isAdmin: boolean): Prisma.PostWhereInput {
  if (isAdmin) return {};
  return {
    OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }],
  };
}
