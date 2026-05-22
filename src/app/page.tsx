import Feed from "@/app/components/feed/Feed";

export default function Home() {
  return (
    <main className="container pt-28 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Home</h1>
          <p className="text-navyGray/70 dark:text-white/60 mt-1">
            The latest posts on Tw@er.
          </p>
        </div>
        <Feed />
      </div>
    </main>
  );
}
