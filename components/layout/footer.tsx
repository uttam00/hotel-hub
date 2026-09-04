import Link from "next/link";

import { Logo } from "@/components/brand/logo";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:px-6 md:flex-row lg:px-8">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-3">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HostelHub. All rights reserved.
          </p>
        </div>
        <nav className="flex items-center gap-4" aria-label="Legal">
          <Link
            href="/about"
            className="rounded-sm text-sm text-muted-foreground underline-offset-4 transition-ui hover:text-foreground hover:underline"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="rounded-sm text-sm text-muted-foreground underline-offset-4 transition-ui hover:text-foreground hover:underline"
          >
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
