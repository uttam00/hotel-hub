import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { GoogleMapsProvider } from "@/components/providers/google-maps-provider";
import { ChunkErrorReload } from "@/components/providers/chunk-error-reload";
import { SiteChrome } from "@/components/layout/site-chrome";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Identifiers (room numbers, bed slots, booking refs, amounts in tables) are
// set in mono so they read as coordinates rather than as prose.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "HostelHub — Hostel Operations",
  description:
    "Run your hostel end to end: occupancy, residents, collections and daily operations in one place.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetched server-side and handed to SessionProvider so the client's
  // useSession() is already hydrated with the real role on first render —
  // without this, every fresh page load has a window where the session is
  // "loading" and role-based UI (like the header nav) falls back to its
  // logged-out default, briefly showing the wrong thing to a logged-in admin.
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} font-sans`}>
        {/* Keyboard users land here first — the console's sidebar is long, and
            skipping it is the difference between 1 tab and 30 to reach work. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border focus:border-border-strong focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-overlay"
        >
          Skip to content
        </a>
        <ChunkErrorReload />
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <GoogleMapsProvider>
              <SiteChrome>{children}</SiteChrome>
              <Toaster />
            </GoogleMapsProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
