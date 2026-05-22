"use client";

import type { ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
};

export default function Tooltip({ label, children, side = "top" }: Props) {
  return (
    <span className="relative inline-flex group">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        } whitespace-nowrap rounded-md bg-black/90 text-white text-xs font-medium px-2 py-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-100 z-50`}
      >
        {label}
      </span>
    </span>
  );
}
