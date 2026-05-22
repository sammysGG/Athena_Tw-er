import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import AppShell from "@/app/components/layout/AppShell";
import ChatList from "@/app/components/chat/ChatList";

export const metadata: Metadata = { title: "Chat | Tw@er" };

export default async function ChatIndexPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/chat");

  return (
    <AppShell showTrending={false}>
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <ChatList />
    </AppShell>
  );
}
