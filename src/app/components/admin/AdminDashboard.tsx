"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Avatar from "@/app/components/feed/Avatar";
import VerifiedBadge, { VERIFIED_OPTIONS } from "@/app/components/feed/VerifiedBadge";
import { POST_LABEL_OPTIONS } from "@/app/components/feed/PostLabel";
import InjectComposer from "./InjectComposer";
import { timeAgo } from "@/app/lib/format";

type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  verifiedType: string | null;
  createdAt: string;
  avatarUrl: string | null;
  _count: { posts: number; likes: number; comments: number; followers: number };
};

type AdminPost = {
  id: string;
  content: string;
  createdAt: string;
  pinnedAt: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  label: string | null;
  scheduledFor: string | null;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    verifiedType: string | null;
  };
  _count: { likes: number; comments: number; reposts: number; views: number };
};

type Totals = {
  users: number;
  posts: number;
  likes: number;
  comments: number;
  dms: number;
  roomMsgs: number;
  scheduled: number;
};

type Tab = "overview" | "inject" | "posts" | "users";

export default function AdminDashboard({ currentUserId }: { currentUserId: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [posts, setPosts] = useState<AdminPost[] | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [postFilter, setPostFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as {
        users: AdminUser[];
        posts: AdminPost[];
        totals: Totals;
      };
      setUsers(data.users);
      setPosts(data.posts);
      setTotals(data.totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPosts = useMemo(() => {
    if (!posts) return null;
    const q = postFilter.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        p.author.username.toLowerCase().includes(q) ||
        p.author.displayName.toLowerCase().includes(q) ||
        (p.label ?? "").includes(q)
    );
  }, [posts, postFilter]);

  const filteredUsers = useMemo(() => {
    if (!users) return null;
    const q = userFilter.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.includes(q) ||
        (u.verifiedType ?? "").includes(q)
    );
  }, [users, userFilter]);

  const updatePost = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Update failed");
      return;
    }
    load();
  };

  const updateUser = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Update failed");
      return;
    }
    load();
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

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((p) => p?.filter((x) => x.id !== id) ?? null);
    else setError("Delete failed");
  };

  const deleteUser = async (id: string, username: string) => {
    if (!confirm(`Delete @${username}? Cascades all their posts/likes/comments.`)) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Delete failed");
    }
  };

  return (
    <div>
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
          <Stat label="Users" value={totals.users} />
          <Stat label="Posts" value={totals.posts} />
          <Stat label="Likes" value={totals.likes} />
          <Stat label="Comments" value={totals.comments} />
          <Stat label="DMs" value={totals.dms} />
          <Stat label="Room msgs" value={totals.roomMsgs} />
          <Stat label="Scheduled" value={totals.scheduled} highlight={totals.scheduled > 0} />
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        <TabButton current={tab} value="overview" onPick={setTab}>
          Overview
        </TabButton>
        <TabButton current={tab} value="inject" onPick={setTab}>
          ⚡ Inject
        </TabButton>
        <TabButton current={tab} value="posts" onPick={setTab}>
          Posts {posts && `(${posts.length})`}
        </TabButton>
        <TabButton current={tab} value="users" onPick={setTab}>
          Users {users && `(${users.length})`}
        </TabButton>
      </div>

      {error && (
        <p className="text-sm text-red-500 border border-red-500/30 rounded-md px-4 py-2 mb-4">
          {error}
        </p>
      )}

      {tab === "overview" && (
        <Overview users={users} posts={posts} />
      )}

      {tab === "inject" && users && (
        <InjectComposer
          users={users.map((u) => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            role: u.role,
            verifiedType: u.verifiedType,
          }))}
          onPosted={load}
        />
      )}

      {tab === "posts" && (
        <div>
          <input
            value={postFilter}
            onChange={(e) => setPostFilter(e.target.value)}
            placeholder="Filter by content, @user, or label"
            className="input-class mb-3 bg-white text-navyGray dark:bg-surfaceDark dark:text-white"
          />
          <div className="overflow-x-auto border border-gray-200 dark:border-white/10 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-black/[0.03] dark:bg-white/[0.05] text-left">
                <tr>
                  <th className="p-3 w-48">Author</th>
                  <th className="p-3">Content</th>
                  <th className="p-3 w-32">Label</th>
                  <th className="p-3 w-32 whitespace-nowrap">Stats</th>
                  <th className="p-3 w-24 whitespace-nowrap">When</th>
                  <th className="p-3 w-40 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts === null ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-navyGray/60 dark:text-white/40">
                      Loading…
                    </td>
                  </tr>
                ) : filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-navyGray/60 dark:text-white/40">
                      No posts match.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-gray-200 dark:border-white/10 align-top"
                    >
                      <td className="p-3">
                        <Link
                          href={`/u/${p.author.username}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Avatar
                            name={p.author.displayName}
                            src={p.author.avatarUrl}
                            size={28}
                          />
                          <div className="min-w-0">
                            <div className="truncate font-medium">{p.author.displayName}</div>
                            <div className="text-xs text-navyGray/60 dark:text-white/40 truncate">
                              @{p.author.username}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="p-3">
                        <p className="whitespace-pre-wrap break-words text-navyGray/90 dark:text-white/80 line-clamp-3">
                          {p.content || "(media post)"}
                        </p>
                        {p.mediaUrl && (
                          <p className="text-xs text-primary mt-1">📎 {p.mediaType}</p>
                        )}
                        <div className="flex gap-2 flex-wrap mt-1">
                          {p.pinnedAt && (
                            <span className="text-xs text-primary">📌 pinned</span>
                          )}
                          {p.scheduledFor &&
                            new Date(p.scheduledFor).getTime() > Date.now() && (
                              <span className="text-xs text-amber-600 dark:text-amber-400">
                                ⏰ scheduled {new Date(p.scheduledFor).toLocaleString()}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          value={p.label ?? ""}
                          onChange={(e) =>
                            updatePost(p.id, { label: e.target.value || null })
                          }
                          className="text-xs rounded-md border border-gray-200 dark:border-white/15 bg-white text-navyGray dark:bg-surfaceDark dark:text-white py-1 px-2 outline-none"
                        >
                          <option value="">— none —</option>
                          {POST_LABEL_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 whitespace-nowrap text-navyGray/70 dark:text-white/60">
                        ❤ {p._count.likes} · 💬 {p._count.comments}
                        <br />
                        🔁 {p._count.reposts} · 👁 {p._count.views}
                      </td>
                      <td className="p-3 whitespace-nowrap text-navyGray/60 dark:text-white/40">
                        {timeAgo(p.createdAt)}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap text-sm">
                        <Link
                          href={`/p/${p.id}`}
                          className="text-navyGray/70 dark:text-white/50 hover:text-primary mr-3"
                        >
                          View
                        </Link>
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
        </div>
      )}

      {tab === "users" && (
        <div>
          <input
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Filter by name, email, role, or badge"
            className="input-class mb-3 bg-white text-navyGray dark:bg-surfaceDark dark:text-white"
          />
          <div className="overflow-x-auto border border-gray-200 dark:border-white/10 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-black/[0.03] dark:bg-white/[0.05] text-left">
                <tr>
                  <th className="p-3 w-56">User</th>
                  <th className="p-3 w-56">Email</th>
                  <th className="p-3 w-32">Role</th>
                  <th className="p-3 w-48">Badge</th>
                  <th className="p-3 w-44 whitespace-nowrap">Activity</th>
                  <th className="p-3 w-24 whitespace-nowrap">Joined</th>
                  <th className="p-3 w-24 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers === null ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-navyGray/60 dark:text-white/40">
                      Loading…
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-navyGray/60 dark:text-white/40">
                      No users match.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-gray-200 dark:border-white/10 align-top"
                    >
                      <td className="p-3">
                        <Link
                          href={`/u/${u.username}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Avatar
                            name={u.displayName}
                            src={u.avatarUrl}
                            size={28}
                          />
                          <div className="min-w-0">
                            <div className="font-medium truncate flex items-center gap-1">
                              {u.displayName}
                              <VerifiedBadge type={u.verifiedType} />
                            </div>
                            <div className="text-xs text-navyGray/60 dark:text-white/40 truncate">
                              @{u.username}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="p-3 text-navyGray/70 dark:text-white/60 truncate">
                        {u.email}
                      </td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          disabled={u.id === currentUserId}
                          onChange={(e) => updateUser(u.id, { role: e.target.value })}
                          className="text-xs rounded-md border border-gray-200 dark:border-white/15 bg-white text-navyGray dark:bg-surfaceDark dark:text-white py-1 px-2 outline-none disabled:opacity-50"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.verifiedType ?? ""}
                          onChange={(e) =>
                            updateUser(u.id, { verifiedType: e.target.value || null })
                          }
                          className="text-xs rounded-md border border-gray-200 dark:border-white/15 bg-white text-navyGray dark:bg-surfaceDark dark:text-white py-1 px-2 outline-none w-full"
                        >
                          <option value="">— none —</option>
                          {VERIFIED_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 whitespace-nowrap text-navyGray/70 dark:text-white/60">
                        📝 {u._count.posts} · ❤ {u._count.likes}
                        <br />
                        💬 {u._count.comments} · 👥 {u._count.followers}
                      </td>
                      <td className="p-3 whitespace-nowrap text-navyGray/60 dark:text-white/40">
                        {timeAgo(u.createdAt)}
                      </td>
                      <td className="p-3 text-right">
                        {u.id === currentUserId ? (
                          <span className="text-xs text-navyGray/40 dark:text-white/30">
                            (you)
                          </span>
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
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border rounded-xl p-3 ${
        highlight
          ? "border-amber-500/50 bg-amber-500/5"
          : "border-gray-200 dark:border-white/10"
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-navyGray/60 dark:text-white/50">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function TabButton({
  current,
  value,
  onPick,
  children,
}: {
  current: Tab;
  value: Tab;
  onPick: (t: Tab) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onPick(value)}
      className={`px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer ${
        current === value
          ? "bg-primary text-white"
          : "border border-gray-200 dark:border-white/15"
      }`}
    >
      {children}
    </button>
  );
}

function Overview({
  users,
  posts,
}: {
  users: AdminUser[] | null;
  posts: AdminPost[] | null;
}) {
  const scheduled = posts?.filter(
    (p) => p.scheduledFor && new Date(p.scheduledFor).getTime() > Date.now()
  );
  const recentActivity = posts?.slice(0, 5);
  const newUsers = users?.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="border border-gray-200 dark:border-white/10 rounded-xl p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          ⏰ Scheduled injects {scheduled && `(${scheduled.length})`}
        </h3>
        {!scheduled || scheduled.length === 0 ? (
          <p className="text-sm text-navyGray/60 dark:text-white/40">
            Nothing scheduled. Use the Inject tab to queue scenario posts.
          </p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {scheduled.map((p) => (
              <li
                key={p.id}
                className="border border-amber-500/30 bg-amber-500/5 rounded-md p-3"
              >
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span className="font-medium">@{p.author.username}</span>
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    {new Date(p.scheduledFor!).toLocaleString()}
                  </span>
                </div>
                <p className="line-clamp-2 text-navyGray/80 dark:text-white/70">
                  {p.content || "(media post)"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-gray-200 dark:border-white/10 rounded-xl p-4">
        <h3 className="font-semibold mb-3">Recent activity</h3>
        {!recentActivity ? (
          <p className="text-sm text-navyGray/60 dark:text-white/40">Loading…</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {recentActivity.map((p) => (
              <li key={p.id} className="flex gap-2 items-start">
                <Avatar
                  name={p.author.displayName}
                  src={p.author.avatarUrl}
                  size={24}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-navyGray/60 dark:text-white/40">
                    @{p.author.username} · {timeAgo(p.createdAt)}
                  </div>
                  <p className="line-clamp-2 text-navyGray/80 dark:text-white/70">
                    {p.content || "(media post)"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-gray-200 dark:border-white/10 rounded-xl p-4">
        <h3 className="font-semibold mb-3">New users</h3>
        {!newUsers ? (
          <p className="text-sm text-navyGray/60 dark:text-white/40">Loading…</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {newUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                <Avatar name={u.displayName} src={u.avatarUrl} size={24} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate flex items-center gap-1">
                    {u.displayName}
                    <VerifiedBadge type={u.verifiedType} />
                  </div>
                  <div className="text-xs text-navyGray/60 dark:text-white/40 truncate">
                    @{u.username} · joined {timeAgo(u.createdAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-gray-200 dark:border-white/10 rounded-xl p-4">
        <h3 className="font-semibold mb-3">Quick links</h3>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link href="/agentwhoami" className="text-primary hover:underline">
              /agentwhoami — your session
            </Link>
          </li>
          <li>
            <Link href="/explore" className="text-primary hover:underline">
              /explore — what players see first
            </Link>
          </li>
          <li>
            <Link href="/" className="text-primary hover:underline">
              / — public feed (scheduled posts hidden from non-admins)
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
