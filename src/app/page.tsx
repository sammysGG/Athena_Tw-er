import Feed from "@/app/components/feed/Feed";
import Trending from "@/app/components/feed/Trending";

export default function Home() {
  return (
    <main className="container pt-28 pb-16 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[280px_1fr] gap-6 max-w-5xl mx-auto">
        <div className="order-2 md:order-1">
          <div className="md:sticky md:top-24">
            <Trending />
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Home</h1>
            <p className="text-navyGray/70 dark:text-white/60 mt-1">
              The latest posts on Tw@er.
            </p>
          </div>
          <Feed />
        </div>
      </div>
    </main>
  );
}
