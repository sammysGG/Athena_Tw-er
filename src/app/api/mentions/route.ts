import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 30).toLowerCase();
  if (!q) return NextResponse.json({ users: [] });

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q } },
        { displayName: { contains: q } },
      ],
    },
    orderBy: { username: "asc" },
    take: 8,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
    },
  });
  return NextResponse.json({ users });
}
