import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await requireUser();
    const { id } = await params;

    const existing = await prisma.repost.findUnique({
      where: { userId_postId: { userId: me.id, postId: id } },
    });

    if (existing) {
      await prisma.repost.delete({ where: { id: existing.id } });
    } else {
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await prisma.repost.create({ data: { userId: me.id, postId: id } });
    }

    const count = await prisma.repost.count({ where: { postId: id } });
    return NextResponse.json({ reposted: !existing, count });
  } catch (err) {
    return errorResponse(err);
  }
}
