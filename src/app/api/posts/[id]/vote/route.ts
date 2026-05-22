import { NextResponse } from "next/server";
import { requireUser, errorResponse, HttpError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const body = (await req.json()) as { optionId?: string };
    if (!body.optionId) throw new HttpError(400, "optionId required");

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, kind: true, pollExpiresAt: true },
    });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (post.kind !== "poll") throw new HttpError(400, "Not a poll");
    if (post.pollExpiresAt && post.pollExpiresAt.getTime() <= Date.now())
      throw new HttpError(400, "Poll has ended");

    const option = await prisma.pollOption.findUnique({ where: { id: body.optionId } });
    if (!option || option.postId !== id) throw new HttpError(400, "Invalid option");

    await prisma.pollVote.upsert({
      where: { userId_postId: { userId: me.id, postId: id } },
      update: { optionId: body.optionId },
      create: { userId: me.id, postId: id, optionId: body.optionId },
    });

    // Return current counts
    const options = await prisma.pollOption.findMany({
      where: { postId: id },
      orderBy: { order: "asc" },
      include: { _count: { select: { votes: true } } },
    });
    const total = options.reduce((n, o) => n + o._count.votes, 0);
    return NextResponse.json({ optionId: body.optionId, options, total });
  } catch (err) {
    return errorResponse(err);
  }
}
