import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Tw@er",
};

export default function NotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center dark:bg-baseInk pt-28 pb-20">
      <div className="container flex flex-col items-center gap-6 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-navyGray dark:text-white/70 max-w-md">
          That page doesn&apos;t exist. Head back to the feed.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-md bg-primary text-white font-medium hover:opacity-90"
        >
          Back to Feed
        </Link>
      </div>
    </section>
  );
}
