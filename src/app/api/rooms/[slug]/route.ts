import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { parseMediaUrl } from "@/lib/media";

const MAX_MSG = 800;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const room = await prisma.chatRoom.findUnique({
    where: { slug },
    include: {
      createdBy: { select: { id: true, username: true, displayName: true } },
    },
  });
  if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const since = url.searchParams.get("since");
  const sinceDate = since ? new Date(since) : null;

  const messages = await prisma.roomMessage.findMany({
    where: { roomId: room.id, ...(sinceDate ? { createdAt: { gt: sinceDate } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      sender: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
      },
    },
  });

  return NextResponse.json({ room, messages });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const me = await requireUser();
    const { slug } = await params;
    const room = await prisma.chatRoom.findUnique({ where: { slug } });
    if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

    const message = await prisma.roomMessage.create({
      data: {
        roomId: room.id,
        senderId: me.id,
        content: text,
        mediaUrl: storedMediaUrl,
        mediaType: storedMediaType,
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const me = await requireUser();
    const { slug } = await params;
    const room = await prisma.chatRoom.findUnique({ where: { slug } });
    if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (me.role !== "admin" && room.createdById !== me.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.chatRoom.delete({ where: { id: room.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
