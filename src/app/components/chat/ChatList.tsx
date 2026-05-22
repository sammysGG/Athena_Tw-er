"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Avatar from "@/app/components/feed/Avatar";
import { ChatListSkeleton } from "@/app/components/ui/Skeleton";
import { timeAgo } from "@/app/lib/format";

type ChatSummary = {
  other: { id: string; username: string; displayName: string; avatarUrl: string | null };
  lastMessage: { content: string; createdAt: string; fromMe: boolean; mediaUrl: string | null };
  unread: number;
};

export default function ChatList() {
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [filter, setFilter] = useState("");

  const load = async () => {
    const res = await fetch("/api/chats", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { chats: ChatSummary[] };
      setChats(data.chats);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by name or @username"
        className="input-class mb-4"
      />
      <p className="text-sm text-navyGray/60 dark:text-white/50 mb-4">
        Visit any profile and tap <span className="font-semibold">Message</span> to start a new conversation.
      </p>
      {chats === null ? (
        <ChatListSkeleton />
      ) : chats.length === 0 ? (
        <p className="text-navyGray/60 dark:text-white/40">No conversations yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {chats
            .filter((c) => {
              if (!filter) return true;
              const q = filter.toLowerCase();
              return (
                c.other.displayName.toLowerCase().includes(q) ||
                c.other.username.toLowerCase().includes(q)
              );
            })
            .map((c) => (
              <li key={c.other.id}>
                <Link
                  href={`/chat/${c.other.username}`}
                  className="flex items-center gap-3 border border-gray-200 dark:border-white/10 rounded-xl p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                >
                  <Avatar name={c.other.displayName} src={c.other.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold truncate">{c.other.displayName}</span>
                      <span className="text-sm text-navyGray/60 dark:text-white/40 truncate">
                        @{c.other.username}
                      </span>
                      <span className="ml-auto text-xs text-navyGray/50 dark:text-white/40">
                        {timeAgo(c.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-navyGray/80 dark:text-white/70 truncate">
                      {c.lastMessage.fromMe ? "You: " : ""}
                      {c.lastMessage.content || (c.lastMessage.mediaUrl ? "📎 attachment" : "")}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </Link>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
