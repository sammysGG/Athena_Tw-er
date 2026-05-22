import Feed from "@/app/components/feed/Feed";
import KonamiEgg from "@/app/components/feed/KonamiEgg";
import AppShell from "@/app/components/layout/AppShell";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Home</h1>
        <p className="text-navyGray/70 dark:text-white/60 mt-1">
          The latest posts on Tw@er.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <KonamiEgg />
        <Feed />
      </div>
    </AppShell>
  );
}
