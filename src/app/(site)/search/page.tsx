import { Suspense } from "react";
import type { Metadata } from "next";
import SearchResults from "@/app/components/search/SearchResults";

export const metadata: Metadata = { title: "Search | Tw@er" };

export default function SearchPage() {
  return (
    <main className="container pt-28 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Search</h1>
        <Suspense fallback={<p>Loading…</p>}>
          <SearchResults />
        </Suspense>
      </div>
    </main>
  );
}
