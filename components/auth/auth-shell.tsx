import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

/**
 * The frame for every authentication screen.
 *
 * A two-column composition: the form on the left where the eye starts, and a
 * quiet brand panel on the right carrying a fragment of the occupancy plan —
 * the same motif as the landing page, so signing in feels like entering the
 * product rather than passing through an unrelated gate. The panel is purely
 * decorative and collapses away below `lg`, where the form is all that matters.
 */
export function AuthShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-8">
        <Link href="/" className="mb-auto inline-flex w-fit">
          <Logo size="md" />
        </Link>

        <main className="mx-auto w-full max-w-sm py-10">{children}</main>

        <div className="mt-auto text-center text-sm text-muted-foreground">{footer}</div>
      </div>

      <aside
        className="relative hidden overflow-hidden border-l border-border bg-surface-sunken lg:block"
        aria-hidden="true"
      >
        <div className="blueprint-grid absolute inset-0 opacity-60" />
        <div className="relative flex h-full flex-col justify-center gap-3 p-12">
          {[
            { label: "3rd floor", rooms: [4, 2, 4, 3, 4] },
            { label: "2nd floor", rooms: [4, 4, 1, 4, 2] },
            { label: "1st floor", rooms: [3, 4, 4, 2, 4] },
            { label: "Ground floor", rooms: [4, 3, 4, 4, 1] },
          ].map((band) => (
            <div key={band.label} className="flex items-center gap-3">
              <div className="flex w-24 shrink-0 items-center justify-end border-r border-border pr-3">
                <span className="text-2xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {band.label}
                </span>
              </div>
              <div className="flex gap-1.5">
                {band.rooms.map((occupied, i) => (
                  <div
                    key={i}
                    className="flex w-16 flex-col gap-1 rounded-sm border border-border bg-card p-1.5"
                  >
                    <span className="font-mono text-2xs font-semibold text-muted-foreground">
                      {band.label === "Ground floor" ? "G" : band.label[0]}0{i + 1}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 4 }).map((_, s) => (
                        <span
                          key={s}
                          className={
                            s < occupied
                              ? "size-1.5 rounded-[2px] bg-occupied"
                              : "size-1.5 rounded-[2px] ring-1 ring-inset ring-available"
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="mt-6 max-w-xs text-sm text-muted-foreground">
            Every floor, room and bed — under control.
          </p>
        </div>
      </aside>
    </div>
  );
}
