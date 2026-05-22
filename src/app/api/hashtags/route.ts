import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractHashtags } from "@/lib/text";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 40).toLowerCase();
  if (!q) return NextResponse.json({ tags: [] });

  // Pull recent posts whose content contains the query (cheap upper bound),
  // then extract & count hashtags that start with q.
  const posts = await prisma.post.findMany({
    where: { content: { contains: `#${q}` } },
    select: { content: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const t of extractHashtags(p.content)) {
      if (t.startsWith(q)) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  const tags = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  return NextResponse.json({ tags });
}
