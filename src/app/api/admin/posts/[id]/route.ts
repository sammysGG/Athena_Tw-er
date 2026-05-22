import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const ALLOWED_LABELS = new Set([
  "disputed",
  "state-media",
  "ai-generated",
  "official",
  "satire",
]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await req.json()) as {
      label?: string | null;
      scheduledFor?: string | null;
    };
    const data: Record<string, string | Date | null> = {};
    if (body.label !== undefined) {
      if (body.label && !ALLOWED_LABELS.has(body.label))
        return NextResponse.json({ error: "Invalid label" }, { status: 400 });
      data.label = body.label || null;
    }
    if (body.scheduledFor !== undefined) {
      data.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
    }
    const post = await prisma.post.update({ where: { id }, data });
    return NextResponse.json({ post });
  } catch (err) {
    return errorResponse(err);
  }
}
