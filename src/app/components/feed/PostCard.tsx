"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Avatar from "./Avatar";
import MediaPreview from "./MediaPreview";
import { timeAgo } from "@/app/lib/format";

export type PostAuthor = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  role?: string;
};

export type FeedPost = {
  id: string;
  content: string;
  createdAt: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  pinnedAt?: string | null;
  author: PostAuthor;
  _count: { likes: number; comments: number };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl?: string | null; role?: string };
};

export default function PostCard({
  post,
  onChanged,
}: {
  post: FeedPost;
  onChanged?: () => void;
}) {
  const { data: session } = useSession();
  const authed = Boolean(session?.user);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const isAuthor = session?.user?.id === post.author.id;

  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [pinned, setPinned] = useState(Boolean(post.pinnedAt));

  if (hidden) return null;

  const toggleLike = async () => {
    if (!authed) return (window.location.href = "/sign-in");
    if (likeBusy) return;
    setLikeBusy(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { liked: boolean; count: number };
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch {
      setError("Could not update like");
    } finally {
      setLikeBusy(false);
    }
  };

  const openComments = async () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments === null) {
      try {
        const res = await fetch(`/api/posts/${post.id}/comments`);
        const data = (await res.json()) as { comments: Comment[] };
        setComments(data.comments);
      } catch {
        setComments([]);
      }
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authed) return (window.location.href = "/sign-in");
    const text = commentText.trim();
    if (!text || commentBusy) return;
    setCommentBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      const data = (await res.json()) as { comment: Comment };
      setComments((prev) => [...(prev ?? []), data.comment]);
      setCommentCount((c) => c + 1);
      setCommentText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to comment");
    } finally {
      setCommentBusy(false);
    }
  };

  const deletePost = async () => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      setHidden(true);
      onChanged?.();
    } else {
      setError("Could not delete");
    }
  };

  const togglePin = async () => {
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pinned: !pinned }),
    });
    if (res.ok) {
      setPinned(!pinned);
      onChanged?.();
    } else {
      setError("Could not pin");
    }
  };

  const deleteComment = async (cid: string) => {
    if (!confirm("Delete comment?")) return;
    const res = await fetch(`/api/comments/${cid}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev?.filter((c) => c.id !== cid) ?? null);
      setCommentCount((c) => Math.max(0, c - 1));
    }
  };

  return (
    <article className="border border-gray-200 dark:border-white/10 rounded-xl p-4">
      {pinned && (
        <p className="text-xs text-primary font-semibold mb-2 flex items-center gap-1">
          📌 Pinned
        </p>
      )}
      <header className="flex items-start gap-3">
        <Link href={`/u/${post.author.username}`}>
          <Avatar name={post.author.displayName} src={post.author.avatarUrl} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link href={`/u/${post.author.username}`} className="font-semibold hover:underline truncate">
              {post.author.displayName}
            </Link>
            {post.author.role === "admin" && (
              <span className="text-[10px] uppercase tracking-wider bg-primary text-white px-1.5 py-0.5 rounded">
                admin
              </span>
            )}
            <Link
              href={`/u/${post.author.username}`}
              className="text-sm text-navyGray/70 dark:text-white/50 hover:underline"
            >
              @{post.author.username}
            </Link>
            <span className="text-sm text-navyGray/60 dark:text-white/40">
              · {timeAgo(post.createdAt)}
            </span>
            <div className="ml-auto flex items-center gap-2 text-sm">
              {isAdmin && (
                <button
                  onClick={togglePin}
                  className="text-navyGray/60 dark:text-white/50 hover:text-primary cursor-pointer"
                  title={pinned ? "Unpin" : "Pin"}
                >
                  {pinned ? "Unpin" : "Pin"}
                </button>
              )}
              {(isAdmin || isAuthor) && (
                <button
                  onClick={deletePost}
                  className="text-navyGray/60 dark:text-white/50 hover:text-red-500 cursor-pointer"
                  title="Delete"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {post.content && (
            <p className="mt-2 whitespace-pre-wrap break-words">{post.content}</p>
          )}
          {post.mediaUrl && post.mediaType && (
            <MediaPreview url={post.mediaUrl} type={post.mediaType} />
          )}

          <div className="mt-3 flex items-center gap-6 text-sm text-navyGray/70 dark:text-white/60">
            <button
              type="button"
              onClick={openComments}
              className="flex items-center gap-2 hover:text-primary cursor-pointer"
              aria-expanded={commentsOpen}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              {commentCount}
            </button>
            <button
              type="button"
              onClick={toggleLike}
              disabled={likeBusy}
              className={`flex items-center gap-2 cursor-pointer ${liked ? "text-red-500" : "hover:text-red-500"}`}
              aria-pressed={liked}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              {likeCount}
            </button>
          </div>

          {commentsOpen && (
            <div className="mt-4 border-t border-gray-200 dark:border-white/10 pt-4 flex flex-col gap-4">
              {comments === null ? (
                <p className="text-sm text-navyGray/60 dark:text-white/40">Loading…</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-navyGray/60 dark:text-white/40">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3 group">
                    <Avatar name={c.user.displayName} size={32} src={c.user.avatarUrl} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <Link href={`/u/${c.user.username}`} className="font-semibold text-sm hover:underline">
                          {c.user.displayName}
                        </Link>
                        {c.user.role === "admin" && (
                          <span className="text-[9px] uppercase tracking-wider bg-primary text-white px-1 py-0.5 rounded">
                            admin
                          </span>
                        )}
                        <span className="text-xs text-navyGray/60 dark:text-white/40">
                          @{c.user.username} · {timeAgo(c.createdAt)}
                        </span>
                        {(isAdmin || c.user.id === session?.user?.id) && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="ml-auto text-xs text-navyGray/40 dark:text-white/30 hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
                    </div>
                  </div>
                ))
              )}

              {authed ? (
                <form onSubmit={submitComment} className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment"
                    maxLength={300}
                    className="flex-1 rounded-md border border-gray-200 dark:border-white/15 bg-transparent py-2 px-3 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={commentBusy || !commentText.trim()}
                    className="px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-40 cursor-pointer"
                  >
                    Reply
                  </button>
                </form>
              ) : (
                <p className="text-sm">
                  <Link href="/sign-in" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>{" "}
                  to reply.
                </p>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        </div>
      </header>
    </article>
  );
}
