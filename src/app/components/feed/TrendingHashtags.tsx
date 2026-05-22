import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { extractHashtags } from "@/lib/text";

export default async function TrendingHashtags() {
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

  if (tags.length === 0) return null;

  return (
    <aside className="border border-gray-200 dark:border-white/10 rounded-xl p-4">
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <span>#</span> Trending tags
      </h2>
      <ul className="flex flex-col gap-2">
        {tags.map((t, i) => (
          <li key={t.tag} className="flex items-baseline gap-2">
            <span className="text-navyGray/50 dark:text-white/40 font-bold w-4 text-sm">
              {i + 1}
            </span>
            <Link
              href={`/tag/${t.tag}`}
              className="text-primary font-medium hover:underline truncate"
            >
              #{t.tag}
            </Link>
            <span className="ml-auto text-xs text-navyGray/50 dark:text-white/40">
              {t.count}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
