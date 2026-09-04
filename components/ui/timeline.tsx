import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { formatRelativeDay, formatTime } from "@/lib/format";
import type { Tone } from "@/components/ui/status-badge";

/**
 * The resident activity timeline (§14) — a chronological merge of everything
 * that happened to a stay: payments, check-ins, attendance, visitors, notices.
 *
 * Events are grouped by day, with the day label stated once as a heading rather
 * than repeated on every row. Within a day only the time is shown, which is the
 * part that actually differs.
 */

export interface TimelineEvent {
  id: string;
  at: string | Date;
  title: ReactNode;
  description?: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  /** Right-aligned figure, e.g. an amount. */
  meta?: ReactNode;
}

const TONE_MARKER: Record<Tone, string> = {
  success: "border-success-border bg-success-subtle text-success",
  warning: "border-warning-border bg-warning-subtle text-warning",
  danger: "border-danger-border bg-danger-subtle text-danger",
  info: "border-info-border bg-info-subtle text-info",
  neutral: "border-border bg-muted text-muted-foreground",
  brand: "border-primary-border bg-primary-subtle text-primary",
};

function groupByDay(events: TimelineEvent[]) {
  const groups = new Map<string, { label: string; events: TimelineEvent[] }>();
  for (const event of events) {
    const date = event.at instanceof Date ? event.at : new Date(event.at);
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toISOString().slice(0, 10);
    if (!groups.has(key)) {
      groups.set(key, { label: formatRelativeDay(date), events: [] });
    }
    groups.get(key)!.events.push(event);
  }
  return Array.from(groups.values());
}

export function Timeline({
  events,
  className,
}: {
  events: TimelineEvent[];
  className?: string;
}) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
  const groups = groupByDay(sorted);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="label-annotation mb-2">{group.label}</h3>
          <ol className="relative">
            {group.events.map((event, i) => {
              const Icon = event.icon;
              const isLast = i === group.events.length - 1;
              return (
                <li key={event.id} className="relative flex gap-3 pb-3 last:pb-0">
                  {/* The connecting rule stops at the last item so the thread
                      doesn't dangle past the final event. */}
                  {!isLast && (
                    <span
                      className="absolute left-3 top-6 h-[calc(100%-1.5rem)] w-px bg-border"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-sm border",
                      TONE_MARKER[event.tone ?? "neutral"]
                    )}
                  >
                    <Icon className="size-3" />
                  </span>
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-0.5">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{event.title}</p>
                      {event.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      {event.meta && (
                        <span className="font-mono text-sm text-foreground">{event.meta}</span>
                      )}
                      <time
                        className="text-xs tabular-nums text-faint"
                        dateTime={new Date(event.at).toISOString()}
                      >
                        {formatTime(event.at)}
                      </time>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
