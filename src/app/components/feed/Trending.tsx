import Link from "next/link";
import Avatar from "./Avatar";
import { prisma } from "@/lib/prisma";

export default async function Trending() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await prisma.post.findMany({
    where: { createdAt: { gte: since } },
    orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
    take: 5,
    include: {
      author: { select: { username: true, displayName: true, avatarUrl: true, role: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return (
    <aside className="border border-gray-200 dark:border-white/10 rounded-xl p-4">
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <span>🔥</span> Top liked this week
      </h2>
      {posts.length === 0 ? (
        <p className="text-sm text-navyGray/60 dark:text-white/40">Nothing trending yet.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {posts.map((p, i) => (
            <li key={p.id}>
              <Link
                href={`/p/${p.id}`}
                className="block border border-gray-200 dark:border-white/10 rounded-lg p-2.5 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-navyGray/50 dark:text-white/40 font-bold w-4 shrink-0">
                    {i + 1}
                  </span>
                  <Avatar name={p.author.displayName} size={20} src={p.author.avatarUrl} />
                  <span className="font-medium truncate">{p.author.displayName}</span>
                  {p.author.role === "admin" && (
                    <span className="text-[9px] uppercase bg-primary text-white px-1 rounded shrink-0">
                      admin
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-navyGray/80 dark:text-white/70 ml-6">
                  {p.content || "(media post)"}
                </p>
                <p className="text-xs text-navyGray/50 dark:text-white/40 ml-6 mt-1">
                  ❤ {p._count.likes} · 💬 {p._count.comments}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
