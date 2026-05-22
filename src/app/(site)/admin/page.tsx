import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/app/components/admin/AdminDashboard";

export const metadata: Metadata = { title: "Admin | Tw@er" };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/admin");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me || me.role !== "admin") redirect("/");

  return (
    <main className="container pt-28 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Admin dashboard</h1>
        <p className="text-navyGray/70 dark:text-white/60 mb-6">
          Hello {me.displayName}. From here you can moderate users and posts.
        </p>
        <AdminDashboard currentUserId={me.id} />
      </div>
    </main>
  );
}
