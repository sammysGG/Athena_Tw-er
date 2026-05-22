"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Avatar from "@/app/components/feed/Avatar";
import { timeAgo } from "@/app/lib/format";

type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
  avatarUrl: string | null;
  _count: { posts: number; likes: number; comments: number };
};

type AdminPost = {
  id: string;
  content: string;
  createdAt: string;
  pinnedAt: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  author: { id: string; username: string; displayName: string; avatarUrl: string | null; role: string };
  _count: { likes: number; comments: number };
};

export default function AdminDashboard({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [posts, setPosts] = useState<AdminPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"posts" | "users">("posts");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { users: AdminUser[]; posts: AdminPost[] };
      setUsers(data.users);
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((p) => p?.filter((x) => x.id !== id) ?? null);
    else setError("Delete failed");
  };

  const togglePin = async (id: string, pinned: boolean) => {
    const res = await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pinned: !pinned }),
    });
    if (res.ok) load();
    else setError("Pin failed");
  };

  const deleteUser = async (id: string, username: string) => {
    if (
      !confirm(
        `Delete @${username}? This will cascade and delete all their posts, comments and likes.`
      )
    )
      return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("posts")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer ${
            tab === "posts"
              ? "bg-primary text-white"
              : "border border-gray-200 dark:border-white/15"
          }`}
        >
          Posts {posts && `(${posts.length})`}
        </button>
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer ${
            tab === "users"
              ? "bg-primary text-white"
              : "border border-gray-200 dark:border-white/15"
          }`}
        >
          Users {users && `(${users.length})`}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 border border-red-500/30 rounded-md px-4 py-2 mb-4">
          {error}
        </p>
      )}

      {tab === "posts" && (
        <div className="overflow-x-auto border border-gray-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] dark:bg-white/[0.05] text-left">
              <tr>
                <th className="p-3">Author</th>
                <th className="p-3">Content</th>
                <th className="p-3">Stats</th>
                <th className="p-3">When</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts === null ? (
                <tr>
                  <td colSpan={5} className="p-4 text-navyGray/60 dark:text-white/40">
                    Loading…
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p.id} className="border-t border-gray-200 dark:border-white/10 align-top">
                    <td className="p-3 min-w-[160px]">
                      <Link href={`/u/${p.author.username}`} className="flex items-center gap-2 hover:underline">
                        <Avatar name={p.author.displayName} src={p.author.avatarUrl} size={28} />
                        <span className="truncate">@{p.author.username}</span>
                      </Link>
                    </td>
                    <td className="p-3 max-w-md">
                      <p className="line-clamp-3 whitespace-pre-wrap">{p.content || "(media post)"}</p>
                      {p.mediaUrl && (
                        <p className="text-xs text-primary mt-1">📎 {p.mediaType}</p>
                      )}
                      {p.pinnedAt && (
                        <p className="text-xs text-primary mt-1">📌 pinned</p>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      ❤ {p._count.likes} · 💬 {p._count.comments}
                    </td>
                    <td className="p-3 whitespace-nowrap text-navyGray/60 dark:text-white/40">
                      {timeAgo(p.createdAt)}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => togglePin(p.id, Boolean(p.pinnedAt))}
                        className="text-primary hover:underline mr-3 cursor-pointer"
                      >
                        {p.pinnedAt ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={() => deletePost(p.id)}
                        className="text-red-500 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "users" && (
        <div className="overflow-x-auto border border-gray-200 dark:border-white/10 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] dark:bg-white/[0.05] text-left">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Activity</th>
                <th className="p-3">Joined</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users === null ? (
                <tr>
                  <td colSpan={6} className="p-4 text-navyGray/60 dark:text-white/40">
                    Loading…
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-200 dark:border-white/10">
                    <td className="p-3">
                      <Link href={`/u/${u.username}`} className="flex items-center gap-2 hover:underline">
                        <Avatar name={u.displayName} src={u.avatarUrl} size={28} />
                        <span>
                          <span className="font-medium">{u.displayName}</span>{" "}
                          <span className="text-navyGray/60 dark:text-white/40">@{u.username}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="p-3 text-navyGray/70 dark:text-white/60">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs uppercase px-2 py-0.5 rounded ${
                          u.role === "admin"
                            ? "bg-primary text-white"
                            : "bg-black/5 dark:bg-white/10"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-navyGray/70 dark:text-white/60">
                      📝 {u._count.posts} · ❤ {u._count.likes} · 💬 {u._count.comments}
                    </td>
                    <td className="p-3 whitespace-nowrap text-navyGray/60 dark:text-white/40">
                      {timeAgo(u.createdAt)}
                    </td>
                    <td className="p-3 text-right">
                      {u.id === currentUserId ? (
                        <span className="text-xs text-navyGray/40 dark:text-white/30">(you)</span>
                      ) : (
                        <button
                          onClick={() => deleteUser(u.id, u.username)}
                          className="text-red-500 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
