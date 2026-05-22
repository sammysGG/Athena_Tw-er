import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const me = await requireUser();

    // Pull every message I'm involved in, group by counterparty in memory.
    const messages = await prisma.chatMessage.findMany({
      where: { OR: [{ senderId: me.id }, { receiverId: me.id }] },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    const byOther = new Map<string, {
      other: { id: string; username: string; displayName: string; avatarUrl: string | null };
      lastMessage: { content: string; createdAt: Date; fromMe: boolean; mediaUrl: string | null };
      unread: number;
    }>();

    for (const m of messages) {
      const otherUser = m.senderId === me.id ? m.receiver : m.sender;
      if (!byOther.has(otherUser.id)) {
        byOther.set(otherUser.id, {
          other: otherUser,
          lastMessage: {
            content: m.content,
            createdAt: m.createdAt,
            fromMe: m.senderId === me.id,
            mediaUrl: m.mediaUrl,
          },
          unread: 0,
        });
      }
      if (m.receiverId === me.id && !m.readAt) {
        byOther.get(otherUser.id)!.unread++;
      }
    }

    return NextResponse.json({
      chats: Array.from(byOther.values()).sort(
        (a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
      ),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
