import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { GoogleMapsProvider } from "@/components/providers/google-maps-provider";
import { ChunkErrorReload } from "@/components/providers/chunk-error-reload";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HostelHub - Student Accommodation Management",
  description: "Find and manage student hostels and accommodations",
  generator: "v0.dev",
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
      <body className={inter.className}>
        <ChunkErrorReload />
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <GoogleMapsProvider>
              <div className="glass-backdrop" aria-hidden="true" />
              <div className="min-h-screen flex flex-col">
                <Header />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex-1">
                  {children}
                </div>
                <Footer />
                <Toaster />
              </div>
            </GoogleMapsProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
