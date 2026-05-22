import { NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const ALLOWED_GENDERS = new Set(["male", "female", "nonbinary", "other", "prefer_not_to_say"]);

export async function GET() {
  try {
    const user = await requireUser();
    const { passwordHash: _omit, ...safe } = user;
    void _omit;
    return NextResponse.json({ user: safe });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json()) as {
      displayName?: string;
      bio?: string | null;
      gender?: string | null;
      location?: string | null;
      website?: string | null;
      avatarUrl?: string | null;
    };

    const data: Record<string, string | null> = {};
    if (typeof body.displayName === "string") {
      const v = body.displayName.trim();
      if (v.length < 1 || v.length > 50)
        return NextResponse.json({ error: "Display name 1-50 chars" }, { status: 400 });
      data.displayName = v;
    }
    if (body.bio !== undefined)
      data.bio = body.bio ? String(body.bio).slice(0, 280) : null;
    if (body.location !== undefined)
      data.location = body.location ? String(body.location).slice(0, 80) : null;
    if (body.website !== undefined) {
      if (body.website) {
        try {
          const u = new URL(body.website);
          if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
          data.website = u.toString();
        } catch {
          return NextResponse.json({ error: "Invalid website URL" }, { status: 400 });
        }
      } else {
        data.website = null;
      }
    }
    if (body.gender !== undefined) {
      if (body.gender && !ALLOWED_GENDERS.has(body.gender))
        return NextResponse.json({ error: "Invalid gender value" }, { status: 400 });
      data.gender = body.gender || null;
    }
    if (body.avatarUrl !== undefined) {
      data.avatarUrl = body.avatarUrl || null;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        gender: true,
        location: true,
        website: true,
        avatarUrl: true,
        role: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
