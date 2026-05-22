import { NextResponse } from "next/server";
import { requireAdmin, errorResponse, HttpError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (id === admin.id) throw new HttpError(400, "Cannot delete yourself");

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
