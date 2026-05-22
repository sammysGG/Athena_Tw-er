import { NextResponse } from "next/server";
import { requireUser, errorResponse, HttpError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await requireUser();
    const { id } = await params;
    if (id === me.id) throw new HttpError(400, "Cannot follow yourself");

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: me.id, followingId: id } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
    } else {
      await prisma.follow.create({ data: { followerId: me.id, followingId: id } });
    }

    const count = await prisma.follow.count({ where: { followingId: id } });
    return NextResponse.json({ following: !existing, followers: count });
  } catch (err) {
    return errorResponse(err);
  }
}
