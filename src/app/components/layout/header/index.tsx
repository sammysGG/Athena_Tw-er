"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Logo from "../logo";
import ThemeToggler from "./ThemeToggle";
import Avatar from "@/app/components/feed/Avatar";

const Header = () => {
  const { data: session } = useSession();
  const [sticky, setSticky] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY >= 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed w-full top-0 left-0 z-50 bg-white/90 dark:bg-surfaceDark/90 backdrop-blur transition-all ${
        sticky ? "shadow-md" : "border-b border-gray-100 dark:border-white/10"
      }`}
    >
      <div className="container">
        <nav className="flex items-center justify-between py-3">
          <Logo />

          <div className="flex items-center gap-3">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <Avatar name={session.user.name || "?"} size={32} />
                  <span className="font-medium text-sm">
                    {session.user.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="bg-black dark:bg-white text-white dark:text-black font-medium px-3 py-1.5 rounded-md hover:opacity-85 cursor-pointer text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="border border-black dark:border-white px-3 py-1.5 rounded-md font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-primary text-white px-3 py-1.5 rounded-md font-medium text-sm hover:opacity-90"
                >
                  Sign Up
                </Link>
              </div>
            )}
            <ThemeToggler />
          </div>

          {/* mobile menu trigger kept for parity (no menu items needed currently) */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="sr-only"
            aria-hidden
          >
            menu
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
