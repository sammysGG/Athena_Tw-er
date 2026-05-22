import { NextResponse } from "next/server";
import { getCurrentUser, errorResponse, HttpError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Unauthorized");

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && comment.userId !== user.id) {
      throw new HttpError(403, "Forbidden");
    }

    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
