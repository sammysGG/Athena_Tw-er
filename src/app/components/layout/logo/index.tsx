"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

const ALT_SLOGANS = [
  "Where ROEs go to retire",
  "Now in 4 timezones",
  "OSINT not included",
  "Source it or shut it",
  "Less posting, more attribution",
  "If you can read this, you've blown your cover",
];

const Logo = () => {
  const [spinning, setSpinning] = useState(false);
  const [alt, setAlt] = useState<string | null>(null);
  const clicks = useRef<number[]>([]);

  const onClick = (e: React.MouseEvent) => {
    const now = Date.now();
    clicks.current = clicks.current.filter((t) => now - t < 600);
    clicks.current.push(now);
    if (clicks.current.length >= 3) {
      e.preventDefault();
      clicks.current = [];
      setSpinning(true);
      setAlt(ALT_SLOGANS[Math.floor(Math.random() * ALT_SLOGANS.length)]);
      window.setTimeout(() => setSpinning(false), 800);
      window.setTimeout(() => setAlt(null), 2500);
    }
  };

  return (
    <Link href="/" onClick={onClick} className="relative flex items-center gap-2">
      <Image
        src="/images/logo.png"
        alt="Tw@er logo"
        width={36}
        height={36}
        className={`rounded-md transition-transform duration-700 ease-out ${
          spinning ? "rotate-[720deg]" : "rotate-0"
        }`}
        priority
      />
      <span className="text-2xl font-bold tracking-tight">
        Tw<span className="text-primary">@</span>er
      </span>
      {alt && (
        <span className="absolute top-full left-12 mt-1 whitespace-nowrap text-xs italic text-primary bg-white dark:bg-surfaceDark border border-gray-200 dark:border-white/15 px-2 py-1 rounded-md shadow-md">
          {alt}
        </span>
      )}
    </Link>
  );
};

export default Logo;
