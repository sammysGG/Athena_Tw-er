import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/layout/AppShell";
import RoomThread from "@/app/components/chat/RoomThread";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  return { title: `#${slug} | Tw@er` };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = await prisma.chatRoom.findUnique({
    where: { slug },
    include: { createdBy: { select: { id: true, username: true, displayName: true } } },
  });
  if (!room) notFound();

  return (
    <AppShell showTrending={false}>
      <RoomThread
        room={{
          id: room.id,
          slug: room.slug,
          name: room.name,
          description: room.description,
          createdBy: room.createdBy,
        }}
      />
    </AppShell>
  );
}
