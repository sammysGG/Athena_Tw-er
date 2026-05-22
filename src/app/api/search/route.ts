import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (!raw) return NextResponse.json({ posts: [], users: [], q: "", mode: "all" });

  // Mode selection based on prefix
  let mode: "all" | "user" | "tag" = "all";
  let q = raw;
  if (raw.startsWith("@")) {
    mode = "user";
    q = raw.slice(1);
  } else if (raw.startsWith("#")) {
    mode = "tag";
    q = raw.slice(1);
  }

  const postsPromise =
    mode === "user"
      ? Promise.resolve([])
      : prisma.post.findMany({
          where: { content: { contains: mode === "tag" ? `#${q}` : q } },
          orderBy: { createdAt: "desc" },
          take: 25,
          include: {
            author: {
              select: { id: true, username: true, displayName: true, avatarUrl: true, role: true },
            },
            _count: { select: { likes: true, comments: true } },
          },
        });

  const usersPromise =
    mode === "tag"
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: q } },
              { displayName: { contains: q } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 15,
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            role: true,
          },
        });

  const [posts, users] = await Promise.all([postsPromise, usersPromise]);
  return NextResponse.json({ posts, users, q: raw, mode });
}
