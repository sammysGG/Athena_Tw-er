import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const likes = await prisma.like.findMany({
    where: { postId: id },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
      },
    },
  });
  const users = likes.map((l) => l.user);
  return NextResponse.json({ users });
}
