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

    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId: me.id, postId: id } },
    });

    if (existing) {
      await prisma.savedPost.delete({ where: { id: existing.id } });
    } else {
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await prisma.savedPost.create({ data: { userId: me.id, postId: id } });
    }

    return NextResponse.json({ saved: !existing });
  } catch (err) {
    return errorResponse(err);
  }
}
