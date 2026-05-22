import { NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const ALLOWED_VERIFIED = new Set([
  "press",
  "gov",
  "mil",
  "state",
  "bot",
  "ai",
]);
const ALLOWED_ROLES = new Set(["user", "admin"]);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await req.json()) as {
      verifiedType?: string | null;
      role?: string;
    };

    const data: Record<string, string | null> = {};
    if (body.verifiedType !== undefined) {
      if (body.verifiedType && !ALLOWED_VERIFIED.has(body.verifiedType))
        return NextResponse.json({ error: "Invalid verifiedType" }, { status: 400 });
      data.verifiedType = body.verifiedType || null;
    }
    if (body.role !== undefined) {
      if (!ALLOWED_ROLES.has(body.role))
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      data.role = body.role;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        verifiedType: true,
      },
    });
    return NextResponse.json({ user });
  } catch (err) {
    return errorResponse(err);
  }
}
