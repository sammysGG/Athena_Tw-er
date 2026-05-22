import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_COMMENT_LEN = 280;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await prisma.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
  });
  return NextResponse.json({ comments });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = (body as { content?: string })?.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }
  if (content.length > MAX_COMMENT_LEN) {
    return NextResponse.json(
      { error: `Comments are limited to ${MAX_COMMENT_LEN} characters` },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: { content, postId: id, userId: session.user.id },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
