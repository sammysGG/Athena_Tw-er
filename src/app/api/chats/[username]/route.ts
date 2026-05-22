import { NextResponse } from "next/server";
import { requireUser, errorResponse, HttpError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseMediaUrl } from "@/lib/media";

const MAX_MSG = 800;

async function findOther(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, displayName: true, avatarUrl: true, role: true, bio: true },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const me = await requireUser();
    const { username } = await params;
    const other = await findOther(username);
    if (!other) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (other.id === me.id) throw new HttpError(400, "Cannot chat with yourself");

    const url = new URL(req.url);
    const since = url.searchParams.get("since");
    const sinceDate = since ? new Date(since) : null;

    const messages = await prisma.chatMessage.findMany({
      where: {
        AND: [
          {
            OR: [
              { senderId: me.id, receiverId: other.id },
              { senderId: other.id, receiverId: me.id },
            ],
          },
          ...(sinceDate ? [{ createdAt: { gt: sinceDate } }] : []),
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        content: true,
        mediaUrl: true,
        mediaType: true,
        senderId: true,
        receiverId: true,
        createdAt: true,
        readAt: true,
      },
    });

    // Mark unread inbound as read
    const unread = messages.filter((m) => m.receiverId === me.id && !m.readAt);
    if (unread.length > 0) {
      await prisma.chatMessage.updateMany({
        where: { id: { in: unread.map((m) => m.id) } },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({ other, messages });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const me = await requireUser();
    const { username } = await params;
    const other = await findOther(username);
    if (!other) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (other.id === me.id) throw new HttpError(400, "Cannot chat with yourself");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { content, mediaUrl } = (body ?? {}) as { content?: string; mediaUrl?: string | null };
    const text = content?.trim() ?? "";
    if (!text && !mediaUrl) {
      return NextResponse.json({ error: "Message must include text or media" }, { status: 400 });
    }
    if (text.length > MAX_MSG) {
      return NextResponse.json({ error: `Messages capped at ${MAX_MSG} chars` }, { status: 400 });
    }

    let storedMediaUrl: string | null = null;
    let storedMediaType: string | null = null;
    if (mediaUrl) {
      if (mediaUrl.startsWith("/api/media/")) {
        storedMediaUrl = mediaUrl;
        storedMediaType = /\.(mp4|webm|mov|m4v)$/i.test(mediaUrl) ? "video" : "image";
      } else {
        const parsed = parseMediaUrl(mediaUrl);
        if (!parsed) return NextResponse.json({ error: "Invalid media URL" }, { status: 400 });
        storedMediaUrl = parsed.url;
        storedMediaType = parsed.type;
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        senderId: me.id,
        receiverId: other.id,
        content: text,
        mediaUrl: storedMediaUrl,
        mediaType: storedMediaType,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
