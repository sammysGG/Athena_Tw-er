import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/layout/header";
import Footer from "@/app/components/layout/footer";
import { Providers } from "@/providers/sessionProviders";

const manrope = Manrope({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tw@er — what's happening?",
  description: "A mock social feed where you can post, like and comment.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={manrope.className}>
        <Providers>
          <Header />
          <div className="pt-16">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
