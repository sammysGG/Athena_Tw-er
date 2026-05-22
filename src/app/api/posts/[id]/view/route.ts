import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getCurrentUser, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const me = await getCurrentUser();

    const exists = await prisma.post.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (me) {
      await prisma.postView
        .upsert({
          where: { postId_userId: { postId: id, userId: me.id } },
          update: {},
          create: { postId: id, userId: me.id },
        })
        .catch(() => {});
    } else {
      const hdrs = await headers();
      const fwd = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
      const ua = hdrs.get("user-agent") ?? "";
      const anonKey = createHash("sha256")
        .update(`${id}|${fwd}|${ua}`)
        .digest("hex")
        .slice(0, 32);
      await prisma.postView
        .upsert({
          where: { postId_anonKey: { postId: id, anonKey } },
          update: {},
          create: { postId: id, anonKey },
        })
        .catch(() => {});
    }

    const views = await prisma.postView.count({ where: { postId: id } });
    return NextResponse.json({ views });
  } catch (err) {
    return errorResponse(err);
  }
}
