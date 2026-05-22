import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractHashtags } from "@/lib/text";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("q") ?? "").trim().slice(0, 40);
  if (!raw) return NextResponse.json({ users: [], tags: [] });

  // Strip @ / # if user typed it
  const q = raw.replace(/^[@#]/, "").toLowerCase();
  if (!q) return NextResponse.json({ users: [], tags: [] });

  const [users, postsForTags] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { displayName: { contains: q } },
        ],
      },
      orderBy: { username: "asc" },
      take: 5,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        verifiedType: true,
      },
    }),
    prisma.post.findMany({
      where: { content: { contains: `#${q}` } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { content: true },
    }),
  ]);

  const tagCounts = new Map<string, number>();
  for (const p of postsForTags) {
    for (const t of extractHashtags(p.content)) {
      if (t.startsWith(q)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const tags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  return NextResponse.json({ users, tags });
}
