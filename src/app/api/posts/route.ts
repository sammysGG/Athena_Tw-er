import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseMediaUrl } from "@/lib/media";

const MAX_POST_LEN = 280;

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: [{ pinnedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });
  return NextResponse.json({ posts });
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

    const { content, mediaUrl } = (body ?? {}) as {
      content?: string;
      mediaUrl?: string | null;
    };
    const text = content?.trim() ?? "";
    if (!text && !mediaUrl) {
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
      if (mediaUrl.startsWith("/uploads/")) {
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

    const post = await prisma.post.create({
      data: {
        content: text,
        authorId: user.id,
        mediaUrl: storedMediaUrl,
        mediaType: storedMediaType,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
