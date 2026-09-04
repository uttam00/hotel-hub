import type { Metadata } from "next";
import { Building2, CheckCircle2, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About — HostelHub",
  description:
    "Why HostelHub exists: making student accommodation simple to find and simple to run.",
};

const PILLARS = [
  {
    icon: Building2,
    title: "Our story",
    body: "HostelHub started from a simple frustration: finding a hostel meant phone calls, WhatsApp forwards and site visits, while the people running those hostels tracked hundreds of residents in paper registers.",
  },
  {
    icon: CheckCircle2,
    title: "Our mission",
    body: "Give students a straight answer about what a room costs and what it includes, and give hostel owners a real system for occupancy, collections and daily operations.",
  },
  {
    icon: Users,
    title: "Our community",
    body: "Students, wardens, owners and accountants all use HostelHub daily. Every part of the product is shaped by what those people actually need to get done.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">About HostelHub</h1>
        <p className="mt-3 text-md leading-relaxed text-muted-foreground">
          We&apos;re making student accommodation simple to find and simple to run —
          transparent for the people living in it, and manageable for the people
          responsible for it.
        </p>
      </header>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <section key={pillar.title} className="rounded-md border border-border bg-card p-4">
            <span className="inline-flex size-8 items-center justify-center rounded-sm border border-primary-border bg-primary-subtle">
              <pillar.icon className="size-4 text-primary" />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-foreground">{pillar.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
