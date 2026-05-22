import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseMediaUrl } from "@/lib/media";
import { FEED_POST_INCLUDE } from "@/lib/feed-include";

const MAX_POST_LEN = 280;
const ALLOWED_LABELS = new Set([
  "disputed",
  "state-media",
  "ai-generated",
  "official",
  "satire",
]);

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = (await req.json()) as {
      authorId?: string;
      content?: string;
      mediaUrl?: string | null;
      label?: string | null;
      scheduledFor?: string | null;
    };

    if (!body.authorId) {
      return NextResponse.json({ error: "authorId required" }, { status: 400 });
    }
    const author = await prisma.user.findUnique({ where: { id: body.authorId } });
    if (!author) return NextResponse.json({ error: "Author not found" }, { status: 404 });

    const text = body.content?.trim() ?? "";
    if (!text && !body.mediaUrl) {
      return NextResponse.json(
        { error: "Inject must include text or media" },
        { status: 400 }
      );
    }
    if (text.length > MAX_POST_LEN) {
      return NextResponse.json(
        { error: `Posts are limited to ${MAX_POST_LEN} characters` },
        { status: 400 }
      );
    }

    let mediaUrl: string | null = null;
    let mediaType: string | null = null;
    if (body.mediaUrl) {
      if (body.mediaUrl.startsWith("/api/media/")) {
        mediaUrl = body.mediaUrl;
        mediaType = /\.(mp4|webm|mov|m4v)$/i.test(body.mediaUrl) ? "video" : "image";
      } else {
        const parsed = parseMediaUrl(body.mediaUrl);
        if (!parsed)
          return NextResponse.json({ error: "Invalid media URL" }, { status: 400 });
        mediaUrl = parsed.url;
        mediaType = parsed.type;
      }
    }

    if (body.label && !ALLOWED_LABELS.has(body.label)) {
      return NextResponse.json({ error: "Invalid label" }, { status: 400 });
    }

    const scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;

    const post = await prisma.post.create({
      data: {
        content: text,
        authorId: author.id,
        mediaUrl,
        mediaType,
        label: body.label || null,
        scheduledFor,
        injectedById: admin.id,
      },
      include: FEED_POST_INCLUDE,
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
