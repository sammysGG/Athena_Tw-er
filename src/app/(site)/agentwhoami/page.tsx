import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/layout/AppShell";

export const metadata: Metadata = { title: "agent::whoami | Tw@er" };
export const dynamic = "force-dynamic";

const BANNER = `
   _                    _      _     _      ____  __  __ _
  / \\   __ _  ___ _ __ | |_   | |__ | |__  | __ )|  \\/  (_)
 / _ \\ / _\` |/ _ \\ '_ \\| __|  | '_ \\| '_ \\ |  _ \\| |\\/| | |
/ ___ \\ (_| |  __/ | | | |_   | |_) | |_) || |_) | |  | | |
\\_/   \\_\\__, |\\___|_| |_|\\__|_|_.__/|_.__/ |____/|_|  |_|_|
       |___/`;

export default async function AgentWhoAmIPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/agentwhoami");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me || me.role !== "admin") redirect("/");

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  const ua = hdrs.get("user-agent") ?? "?";
  const host = hdrs.get("host") ?? "?";
  const referer = hdrs.get("referer") ?? "(direct)";

  const flag = `flag{agent_${me.username}_${me.id.slice(0, 8)}}`;

  return (
    <AppShell showTrending={false}>
      <div className="border border-green-500/40 bg-green-500/5 rounded-xl p-6 font-mono text-sm">
        <pre className="text-green-600 dark:text-green-400 text-[10px] sm:text-xs mb-4 overflow-x-auto leading-tight">
          {BANNER}
        </pre>
        <p className="mb-4 text-navyGray dark:text-white/80">
          you-are-here :: capture-the-flag style debug page
        </p>
        <dl className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-y-1.5 gap-x-3 text-navyGray/90 dark:text-white/80">
          <Field k="id" v={me.id} />
          <Field k="username" v={`@${me.username}`} />
          <Field k="display" v={me.displayName} />
          <Field k="role" v={me.role} />
          <Field k="email" v={me.email} />
          <Field k="joined" v={me.createdAt.toISOString()} />
          <Field k="ip" v={ip} />
          <Field k="host" v={host} />
          <Field k="referer" v={referer} />
          <Field k="user-agent" v={ua} className="break-all" />
        </dl>
        <p className="mt-6 text-green-600 dark:text-green-400 font-bold tracking-wider select-all">
          {flag}
        </p>
        <p className="mt-2 text-xs text-navyGray/50 dark:text-white/40">
          Tip: this route is admin-only. Everyone else gets a quiet 307.
        </p>
      </div>
    </AppShell>
  );
}

function Field({
  k,
  v,
  className,
}: {
  k: string;
  v: string;
  className?: string;
}) {
  return (
    <>
      <dt className="text-navyGray/60 dark:text-white/40">{k}</dt>
      <dd className={className}>{v}</dd>
    </>
  );
}
