import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarCheck,
  Layers,
  Receipt,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";

/**
 * The public landing page.
 *
 * The marketplace speaks in a slightly warmer register than the console, but it
 * is built from the same tokens and the same geometry — a visitor who signs up
 * should recognise the product they arrive in. The hero art is a fragment of
 * the occupancy plan itself rather than a stock illustration: it shows what the
 * product actually does.
 */
export default async function Home() {
  const session = await getServerSession(authOptions);

  // Admins landing on the public marketing page — via a pasted URL, a bookmark,
  // or a reopened tab — belong on their own dashboard. Students are different:
  // the home page IS their landing page after login, so they stay here.
  if (session?.user) {
    switch (session.user.role) {
      case "SUPER_ADMIN":
        redirect("/super-admin");
      case "HOSTEL_ADMIN":
        redirect("/hostel-admin");
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* ---------- Hero ---------- */}
      <section className="grid items-center gap-8 py-12 lg:grid-cols-2 lg:gap-12 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
            <Building2 className="size-3.5 text-primary" />
            Hostel operations, end to end
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
            Every floor, room and bed — <span className="text-primary">under control</span>.
          </h1>
          <p className="mt-4 max-w-xl text-md leading-relaxed text-muted-foreground">
            HostelHub is where students find a place to live and where owners run the
            building: occupancy, residents, attendance, visitors and collections in one
            system.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/hostels">
                <Search className="size-4" />
                Browse hostels
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/register">
                Create an account
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* A miniature of the occupancy plan — the signature screen, used as
            the product shot. Purely decorative here, hence aria-hidden. */}
        <div
          className="relative overflow-hidden rounded-md border border-border bg-card p-4"
          aria-hidden="true"
        >
          <div className="blueprint-grid absolute inset-0 opacity-40" />
          <div className="relative flex flex-col gap-2">
            {[
              { floor: "3rd floor", rooms: [4, 2, 4, 3] },
              { floor: "2nd floor", rooms: [4, 4, 1, 4] },
              { floor: "1st floor", rooms: [3, 4, 4, 2] },
            ].map((band) => (
              <div key={band.floor} className="flex items-center gap-3">
                <div className="flex w-20 shrink-0 items-center gap-1.5 border-r border-border pr-2">
                  <Layers className="size-3 text-faint" />
                  <span className="text-2xs font-semibold text-muted-foreground">
                    {band.floor}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {band.rooms.map((occupied, i) => (
                    <div
                      key={i}
                      className="flex w-16 flex-col gap-1 rounded-sm border border-border bg-background p-1.5"
                    >
                      <span className="font-mono text-2xs font-semibold text-foreground">
                        {band.floor[0]}0{i + 1}
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
          </div>
        </div>
      </section>

      {/* ---------- For students ---------- */}
      <section className="border-t border-border py-12 lg:py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Looking for a place to stay?</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Find a hostel near your college, see exactly what a room includes, and book it
          without a single phone call.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Search",
              body: "Filter by city, room type, price and the amenities you actually care about.",
            },
            {
              icon: BedDouble,
              title: "Compare",
              body: "Real room details — capacity, AC, attached bathroom, cupboards — not just photos.",
            },
            {
              icon: ShieldCheck,
              title: "Book securely",
              body: "Pay online, keep every receipt, and manage your stay from your dashboard.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-md border border-border bg-card p-4">
              <span className="inline-flex size-8 items-center justify-center rounded-sm border border-primary-border bg-primary-subtle">
                <item.icon className="size-4 text-primary" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- For operators ---------- */}
      <section className="border-t border-border py-12 lg:py-16">
        <h2 className="text-2xl font-semibold tracking-tight">Running a hostel?</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Stop tracking a building in a notebook. See occupancy at a glance, know what
          you&apos;re owed, and keep the daily routine moving.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Layers,
              title: "Occupancy plan",
              body: "Floors, rooms and every bed in them, live.",
            },
            {
              icon: Users,
              title: "Residents",
              body: "Who lives where, since when, and how to reach them.",
            },
            {
              icon: Receipt,
              title: "Collections",
              body: "What came in, what's pending, and what's overdue.",
            },
            {
              icon: CalendarCheck,
              title: "Daily operations",
              body: "Attendance, visitors and notices in one place.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-md border border-border bg-card p-4">
              <item.icon className="size-4 text-primary" />
              <h3 className="mt-2.5 text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/contact">
              Talk to us about your property
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
