import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_POST_LEN = 280;

export async function GET() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  if (content.length > MAX_POST_LEN) {
    return NextResponse.json(
      { error: `Posts are limited to ${MAX_POST_LEN} characters` },
      { status: 400 }
    );
  }

  const post = await prisma.post.create({
    data: { content, authorId: session.user.id },
    include: {
      author: { select: { id: true, username: true, displayName: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
