"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";

type Liker = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
};

type Props = {
  postId: string;
  children: React.ReactNode;
};

export default function LikersPopover({ postId, children }: Props) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<Liker[] | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openWithDelay = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(true), 250);
  };

  const close = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setOpen(false);
  };

  useEffect(() => {
    if (!open || users !== null) return;
    fetch(`/api/posts/${postId}/likers`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setUsers(d.users))
      .catch(() => setUsers([]));
  }, [open, postId, users]);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={openWithDelay}
      onMouseLeave={close}
      onFocus={openWithDelay}
      onBlur={close}
    >
      {children}
      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-56 bg-white dark:bg-surfaceDark border border-gray-200 dark:border-white/15 rounded-xl shadow-xl p-3 text-left">
          <p className="text-xs font-semibold text-navyGray/70 dark:text-white/60 mb-2 uppercase tracking-wider">
            Liked by
          </p>
          {users === null ? (
            <p className="text-sm text-navyGray/60 dark:text-white/40">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-navyGray/60 dark:text-white/40">No likes yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {users.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/u/${u.username}`}
                    className="flex items-center gap-2 hover:opacity-80"
                  >
                    <Avatar name={u.displayName} src={u.avatarUrl} size={24} />
                    <span className="text-sm truncate">
                      <span className="font-medium">{u.displayName}</span>{" "}
                      <span className="text-navyGray/60 dark:text-white/40">
                        @{u.username}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </span>
  );
}
