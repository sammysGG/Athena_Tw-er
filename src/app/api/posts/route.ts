import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseMediaUrl } from "@/lib/media";

const MAX_POST_LEN = 280;
const MAX_OPTION_LEN = 40;

const POLL_INCLUDE = {
  pollOptions: {
    orderBy: { order: "asc" as const },
    include: { _count: { select: { votes: true } } },
  },
};

const FEED_INCLUDE = {
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
  },
  _count: { select: { likes: true, comments: true, reposts: true, views: true } },
  ...POLL_INCLUDE,
} as const;

export async function GET() {
  const [posts, reposts] = await Promise.all([
    prisma.post.findMany({
      orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      include: FEED_INCLUDE,
    }),
    prisma.repost.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { username: true, displayName: true } },
        post: { include: FEED_INCLUDE },
      },
    }),
  ]);

  // Merge: each row carries a sort key (pinnedAt > createdAt for posts,
  // repost.createdAt for reposts). Pinned posts always lead.
  type Row = {
    sortKey: number;
    pinned: boolean;
    payload: (typeof posts)[number] & {
      repostedBy?: { username: string; displayName: string };
    };
  };
  const rows: Row[] = [];
  for (const p of posts) {
    rows.push({
      sortKey: p.createdAt.getTime(),
      pinned: Boolean(p.pinnedAt),
      payload: p,
    });
  }
  const seenAsRepost = new Set<string>();
  for (const r of reposts) {
    if (seenAsRepost.has(r.postId)) continue;
    seenAsRepost.add(r.postId);
    rows.push({
      sortKey: r.createdAt.getTime(),
      pinned: false,
      payload: { ...r.post, repostedBy: r.user },
    });
  }

  rows.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.sortKey - a.sortKey;
  });

  // Deduplicate: if the same post appears both as an original and as a
  // repost row, keep whichever is newer.
  const byId = new Map<string, Row>();
  for (const row of rows) {
    const existing = byId.get(row.payload.id);
    if (!existing || row.sortKey > existing.sortKey) byId.set(row.payload.id, row);
  }
  const finalRows = Array.from(byId.values())
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.sortKey - a.sortKey;
    })
    .slice(0, 50);

  return NextResponse.json({ posts: finalRows.map((r) => r.payload) });
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const {
      content,
      mediaUrl,
      kind: kindRaw,
      pollOptions,
      pollDurationHours,
    } = (body ?? {}) as {
      content?: string;
      mediaUrl?: string | null;
      kind?: string;
      pollOptions?: string[];
      pollDurationHours?: number | null;
    };

    const kind = ["post", "poll", "question"].includes(String(kindRaw))
      ? (kindRaw as "post" | "poll" | "question")
      : "post";

    const text = content?.trim() ?? "";
    if (!text && !mediaUrl && kind !== "poll") {
      return NextResponse.json(
        { error: "Posts must include text or media" },
        { status: 400 }
      );
    }
    if (text.length > MAX_POST_LEN) {
      return NextResponse.json(
        { error: `Posts are limited to ${MAX_POST_LEN} characters` },
        { status: 400 }
      );
    }

    let storedMediaUrl: string | null = null;
    let storedMediaType: string | null = null;
    if (mediaUrl) {
      if (mediaUrl.startsWith("/api/media/")) {
        storedMediaUrl = mediaUrl;
        storedMediaType = /\.(mp4|webm|mov|m4v)$/i.test(mediaUrl) ? "video" : "image";
      } else {
        const parsed = parseMediaUrl(mediaUrl);
        if (!parsed) {
          return NextResponse.json({ error: "Invalid media URL" }, { status: 400 });
        }
        storedMediaUrl = parsed.url;
        storedMediaType = parsed.type;
      }
    }

    let optionRows: { text: string; order: number }[] = [];
    let pollExpiresAt: Date | null = null;
    if (kind === "poll") {
      const cleaned = (pollOptions ?? [])
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
        .map((s) => s.slice(0, MAX_OPTION_LEN));
      if (cleaned.length < 2 || cleaned.length > 4) {
        return NextResponse.json(
          { error: "Polls need 2–4 options" },
          { status: 400 }
        );
      }
      optionRows = cleaned.map((text, order) => ({ text, order }));
      if (pollDurationHours && pollDurationHours > 0) {
        const hours = Math.min(Math.max(pollDurationHours, 1), 24 * 14);
        pollExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      }
    }

    const post = await prisma.post.create({
      data: {
        content: text,
        authorId: user.id,
        mediaUrl: storedMediaUrl,
        mediaType: storedMediaType,
        kind,
        pollExpiresAt,
        pollOptions: optionRows.length ? { create: optionRows } : undefined,
      },
      include: FEED_INCLUDE,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
