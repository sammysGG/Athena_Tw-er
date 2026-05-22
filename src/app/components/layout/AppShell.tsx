import SideNav from "./SideNav";
import Trending from "@/app/components/feed/Trending";
import TrendingHashtags from "@/app/components/feed/TrendingHashtags";

type Props = {
  children: React.ReactNode;
  rightColumn?: React.ReactNode;
  /** when false, the right column area is collapsed entirely */
  showTrending?: boolean;
  /** when true, content fills the full width (no right column, wider container) */
  wide?: boolean;
};

export default function AppShell({
  children,
  rightColumn,
  showTrending = true,
  wide = false,
}: Props) {
  if (wide) {
    return (
      <main className="w-full px-5 sm:px-7 pb-16 min-h-screen pt-8">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 max-w-[1600px] mx-auto">
          <aside className="hidden md:block">
            <div className="sticky top-24">
              <SideNav />
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="container pb-16 min-h-screen pt-8">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr_300px] gap-6 max-w-6xl mx-auto">
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <SideNav />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-4">
            {rightColumn ?? (showTrending ? (
              <>
                <TrendingHashtags />
                <Trending />
              </>
            ) : null)}
          </div>
        </aside>
      </div>
    </main>
  );
}
