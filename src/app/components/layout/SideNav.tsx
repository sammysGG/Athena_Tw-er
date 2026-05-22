"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type Item = {
  href: string;
  label: string;
  icon: React.ReactNode;
  authOnly?: boolean;
  adminOnly?: boolean;
};

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3l9 9" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function ExploreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
function SavedIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
function CogIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.86l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.86-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.12-1.55 1.7 1.7 0 0 0-1.86.34l-.06.06A2 2 0 1 1 4.18 16.92l.06-.06A1.7 1.7 0 0 0 4.58 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.66 8.88a1.7 1.7 0 0 0-.34-1.86l-.06-.06A2 2 0 1 1 7.08 4.18l.06.06a1.7 1.7 0 0 0 1.86.34H9A1.7 1.7 0 0 0 10 3.18V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.86-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.86V9c.32.78.96 1.31 1.55 1.55H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default function SideNav() {
  const { data: session } = useSession();
  const pathname = usePathname() ?? "/";
  const isAdmin = session?.user?.role === "admin";
  const username = session?.user?.username;

  const items: Item[] = [
    { href: "/", label: "Home", icon: <HomeIcon /> },
    { href: "/explore", label: "Explore", icon: <ExploreIcon /> },
    { href: "/saved", label: "Saved", icon: <SavedIcon />, authOnly: true },
    { href: "/chat", label: "Chat", icon: <ChatIcon />, authOnly: true },
    { href: username ? `/u/${username}` : "/sign-in", label: "Profile", icon: <ProfileIcon />, authOnly: true },
    { href: "/settings", label: "Settings", icon: <CogIcon />, authOnly: true },
    { href: "/admin", label: "Admin", icon: <ShieldIcon />, adminOnly: true },
  ];

  const visible = items.filter((i) => {
    if (i.adminOnly) return isAdmin;
    if (i.authOnly) return Boolean(session?.user);
    return true;
  });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="flex flex-col gap-1">
      {visible.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2 rounded-full font-medium transition-colors ${
            isActive(item.href)
              ? "bg-primary/10 text-primary"
              : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-navyGray dark:text-white/80"
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
