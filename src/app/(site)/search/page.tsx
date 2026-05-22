import { Suspense } from "react";
import type { Metadata } from "next";
import SearchResults from "@/app/components/search/SearchResults";
import SearchBar from "@/app/components/layout/SearchBar";
import AppShell from "@/app/components/layout/AppShell";

export const metadata: Metadata = { title: "Search | Tw@er" };
export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-4">Search</h1>
      <div className="mb-6">
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
      </div>
      <Suspense fallback={<p>Loading…</p>}>
        <SearchResults />
      </Suspense>
    </AppShell>
  );
}
