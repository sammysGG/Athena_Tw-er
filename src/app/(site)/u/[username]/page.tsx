import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Avatar from "@/app/components/feed/Avatar";
import PostList from "@/app/components/feed/PostList";
import AppShell from "@/app/components/layout/AppShell";
import FollowButton from "@/app/components/profile/FollowButton";
import { FEED_POST_INCLUDE, serializePost } from "@/lib/feed-include";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
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
      createdAt: true,
      _count: { select: { posts: true, followers: true, following: true } },
    },
  });
  if (!user) notFound();

  const session = await getServerSession(authOptions);
  const isMe = session?.user?.id === user.id;

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: FEED_POST_INCLUDE,
  });

  const serialized = posts.map(serializePost);

  return (
    <AppShell>
      <div className="border border-gray-200 dark:border-white/10 rounded-xl p-6 flex gap-4">
        <Avatar name={user.displayName} src={user.avatarUrl} size={80} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{user.displayName}</h1>
                {user.role === "admin" && (
                  <span className="text-xs uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded">
                    admin
                  </span>
                )}
              </div>
              <p className="text-navyGray/70 dark:text-white/50">@{user.username}</p>
            </div>
            {isMe ? (
              <Link
                href="/settings"
                className="text-sm px-3 py-1.5 rounded-md border border-gray-200 dark:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
              >
                Edit profile
              </Link>
            ) : session?.user ? (
              <div className="flex gap-2">
                <FollowButton userId={user.id} />
                <Link
                  href={`/chat/${user.username}`}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-200 dark:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                >
                  Message
                </Link>
              </div>
            ) : null}
          </div>
          {user.bio && <p className="mt-3 whitespace-pre-wrap">{user.bio}</p>}
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-navyGray/70 dark:text-white/60">
            {user.location && <li>📍 {user.location}</li>}
            {user.gender && <li>👤 {labelForGender(user.gender)}</li>}
            {user.website && (
              <li>
                🔗{" "}
                <a
                  href={user.website}
                  className="text-primary hover:underline break-all"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {user.website}
                </a>
              </li>
            )}
            <li>📅 Joined {user.createdAt.toLocaleDateString()}</li>
          </ul>
          <p className="mt-2 text-sm text-navyGray/70 dark:text-white/60">
            <span className="font-semibold text-navyGray dark:text-white">
              {user._count.posts}
            </span>{" "}
            posts ·{" "}
            <span className="font-semibold text-navyGray dark:text-white">
              {user._count.followers}
            </span>{" "}
            followers ·{" "}
            <span className="font-semibold text-navyGray dark:text-white">
              {user._count.following}
            </span>{" "}
            following
          </p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Posts</h2>
      {serialized.length === 0 ? (
        <p className="text-navyGray/60 dark:text-white/40">No posts yet.</p>
      ) : (
        <PostList initialPosts={serialized} />
      )}
    </AppShell>
  );
}

function labelForGender(g: string) {
  switch (g) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    case "nonbinary":
      return "Non-binary";
    case "prefer_not_to_say":
      return "Prefer not to say";
    default:
      return g;
  }
}
