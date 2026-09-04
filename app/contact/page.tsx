import type { Metadata } from "next";
import { Building2, Clock, Mail, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact — HostelHub",
  description: "Get in touch with the HostelHub team.",
};

/**
 * NOTE: this page previously rendered a name/email/message form whose submit
 * button had no handler at all — it looked functional and silently did nothing.
 * There is no contact endpoint in the API, so rather than ship a form that
 * discards what people type, this page offers channels that genuinely work:
 * a mailto link and a tel link. Swap in a real form the moment there is
 * somewhere for it to post.
 */

const CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: "support@hostelhub.com",
    href: "mailto:support@hostelhub.com",
    hint: "We reply within one working day.",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+91 80 4718 2200",
    href: "tel:+918047182200",
    hint: "Monday to Saturday, during office hours.",
  },
];

const HOURS = [
  { day: "Monday – Friday", time: "9:00 am – 6:00 pm" },
  { day: "Saturday", time: "10:00 am – 4:00 pm" },
  { day: "Sunday", time: "Closed" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Get in touch</h1>
        <p className="mt-3 text-md leading-relaxed text-muted-foreground">
          Questions about a booking, or thinking about putting your hostel on HostelHub?
          Reach us directly — a real person will read it.
        </p>
      </header>

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {CHANNELS.map((channel) => (
          <section key={channel.label} className="rounded-md border border-border bg-card p-4">
            <span className="inline-flex size-8 items-center justify-center rounded-sm border border-primary-border bg-primary-subtle">
              <channel.icon className="size-4 text-primary" />
            </span>
            <h2 className="mt-3 text-sm font-semibold text-foreground">{channel.label}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{channel.hint}</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <a href={channel.href}>{channel.value}</a>
            </Button>
          </section>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-4">
          <span className="inline-flex size-8 items-center justify-center rounded-sm border border-border bg-muted">
            <MapPin className="size-4 text-muted-foreground" />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-foreground">Office</h2>
          <address className="mt-1 text-sm not-italic leading-relaxed text-muted-foreground">
            HostelHub Technologies
            <br />
            2nd Floor, Prestige Atrium, Residency Road
            <br />
            Bengaluru, Karnataka 560025
          </address>
        </section>

        <section className="rounded-md border border-border bg-card p-4">
          <span className="inline-flex size-8 items-center justify-center rounded-sm border border-border bg-muted">
            <Clock className="size-4 text-muted-foreground" />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-foreground">Office hours</h2>
          <dl className="mt-2 divide-y divide-border">
            {HOURS.map((row) => (
              <div key={row.day} className="flex justify-between gap-3 py-1.5 text-sm">
                <dt className="text-muted-foreground">{row.day}</dt>
                <dd className="text-foreground">{row.time}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/40 p-4">
        <div className="flex items-start gap-2.5">
          <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">List your hostel</h2>
            <p className="text-sm text-muted-foreground">
              Create an owner account and add your property in a few minutes.
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <a href="/auth/register">Get started</a>
        </Button>
      </section>
    </div>
  );
}
