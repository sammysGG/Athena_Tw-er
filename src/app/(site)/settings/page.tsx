import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/app/components/profile/SettingsForm";
import AppShell from "@/app/components/layout/AppShell";

export const metadata: Metadata = { title: "Edit Profile | Tw@er" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      gender: true,
      location: true,
      website: true,
      avatarUrl: true,
    },
  });
  if (!user) redirect("/sign-in");

  return (
    <AppShell showTrending={false}>
      <h1 className="text-2xl font-bold mb-6">Edit your profile</h1>
      <SettingsForm
        user={{
          ...user,
          bio: user.bio ?? "",
          gender: user.gender ?? "",
          location: user.location ?? "",
          website: user.website ?? "",
          avatarUrl: user.avatarUrl ?? null,
        }}
      />
    </AppShell>
  );
}
