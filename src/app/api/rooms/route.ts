import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function GET() {
  const rooms = await prisma.chatRoom.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      createdBy: { select: { id: true, username: true, displayName: true } },
      _count: { select: { messages: true } },
    },
  });
  return NextResponse.json({ rooms });
}

export async function POST(req: Request) {
  try {
    const me = await requireUser();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { name, description } = (body ?? {}) as { name?: string; description?: string };
    const trimmedName = name?.trim() ?? "";
    if (trimmedName.length < 2 || trimmedName.length > 40) {
      return NextResponse.json({ error: "Name must be 2-40 chars" }, { status: 400 });
    }
    const slug = slugify(trimmedName);
    if (!slug) {
      return NextResponse.json({ error: "Name needs at least one alphanumeric char" }, { status: 400 });
    }
    const exists = await prisma.chatRoom.findUnique({ where: { slug } });
    if (exists) {
      return NextResponse.json({ error: "A room with that name already exists" }, { status: 409 });
    }
    const room = await prisma.chatRoom.create({
      data: {
        slug,
        name: trimmedName,
        description: description?.trim().slice(0, 240) || null,
        createdById: me.id,
      },
    });
    return NextResponse.json({ room }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
