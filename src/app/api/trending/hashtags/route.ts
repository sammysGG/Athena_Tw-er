import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractHashtags } from "@/lib/text";

export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await prisma.post.findMany({
    where: { createdAt: { gte: since } },
    select: { content: true },
    take: 1000,
  });
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const tag of extractHashtags(p.content)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const tags = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));
  return NextResponse.json({ tags });
}
