import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/layout/AppShell";
import ChatThread from "@/app/components/chat/ChatThread";

export const metadata: Metadata = { title: "Chat | Tw@er" };

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/sign-in?callbackUrl=/chat/${username}`);

  const other = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, username: true, displayName: true, avatarUrl: true, role: true, bio: true },
  });
  if (!other) notFound();
  if (other.id === session.user.id) redirect("/chat");

  return (
    <AppShell showTrending={false}>
      <ChatThread
        me={{ id: session.user.id, name: session.user.name ?? null, image: session.user.image ?? null }}
        other={other}
      />
    </AppShell>
  );
}
