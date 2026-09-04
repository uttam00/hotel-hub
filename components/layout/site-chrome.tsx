"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/**
 * Decides which chrome wraps a route.
 *
 * The product is two things at once: a public marketplace (marketing header,
 * centered container, footer) and an operations console (its own full-bleed
 * shell with a sidebar). Those need different frames, and wrapping the console
 * in the marketplace's centered container is what previously squeezed the
 * admin sidebar into a narrow column.
 *
 * Routing is untouched — this switches on pathname rather than moving pages
 * into route groups, so every existing URL keeps working.
 */

/** Routes that render their own shell (sidebar + console header). */
const CONSOLE_PREFIXES = ["/hostel-admin", "/super-admin", "/dashboard", "/profile"];

/** Routes that are their own full-screen composition. */
const BARE_PREFIXES = ["/auth"];

function matches(pathname: string | null, prefixes: string[]) {
  if (!pathname) return false;
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (matches(pathname, BARE_PREFIXES)) {
    return <main id="main">{children}</main>;
  }

  if (matches(pathname, CONSOLE_PREFIXES)) {
    // The console supplies its own header and layout; it only needs the
    // viewport-height ground to sit on.
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
