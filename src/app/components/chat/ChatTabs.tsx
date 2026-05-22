"use client";

import { useState } from "react";
import ChatList from "./ChatList";
import RoomsList from "./RoomsList";

export default function ChatTabs() {
  const [tab, setTab] = useState<"dm" | "rooms">("dm");
  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-white/10 mb-4">
        <button
          onClick={() => setTab("dm")}
          className={`px-4 py-2 text-sm font-medium cursor-pointer border-b-2 ${
            tab === "dm"
              ? "border-primary text-primary"
              : "border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
          }`}
        >
          Direct messages
        </button>
        <button
          onClick={() => setTab("rooms")}
          className={`px-4 py-2 text-sm font-medium cursor-pointer border-b-2 ${
            tab === "rooms"
              ? "border-primary text-primary"
              : "border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
          }`}
        >
          Rooms
        </button>
      </div>
      {tab === "dm" ? <ChatList /> : <RoomsList />}
    </div>
  );
}
