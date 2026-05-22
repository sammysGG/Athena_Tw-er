"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { MeStateProvider } from "@/app/components/feed/MeStateProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <MeStateProvider>{children}</MeStateProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
