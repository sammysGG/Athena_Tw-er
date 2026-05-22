import { NextResponse } from "next/server";
import { requireAdmin, getCurrentUser, errorResponse, HttpError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Unauthorized");

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && post.authorId !== user.id) {
      throw new HttpError(403, "Forbidden");
    }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await req.json()) as { pinned?: boolean };

    const post = await prisma.post.update({
      where: { id },
      data: { pinnedAt: body.pinned ? new Date() : null },
    });

    return NextResponse.json({ post });
  } catch (err) {
    return errorResponse(err);
  }
}
