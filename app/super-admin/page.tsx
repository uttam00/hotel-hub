import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Building2, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Metric, MetricRow } from "@/components/ui/metric";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { HOSTEL_STATUS, StatusBadge } from "@/components/ui/status-badge";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatCurrencyCompact, formatDate, formatNumber, greeting } from "@/lib/format";

/**
 * The platform overview.
 *
 * A super admin's job is different from a warden's: they are watching a network,
 * so the questions are how many properties exist, how many are still waiting to
 * be verified, and how much is flowing through the platform. Properties awaiting
 * review are surfaced directly because they are the one thing that actively
 * blocks someone else's work.
 */
export default async function SuperAdminDashboard() {
  const user = await getCurrentUser();

  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const [
    totalHostels,
    activeHostels,
    pendingHostels,
    totalAdmins,
    totalBookings,
    totalRevenue,
    activeSubscriptions,
    awaitingReview,
  ] = await Promise.all([
    prisma.hostel.count(),
    prisma.hostel.count({ where: { status: "ACTIVE" } }),
    prisma.hostel.count({ where: { status: "PENDING_VERIFICATION" } }),
    prisma.user.count({ where: { role: "HOSTEL_ADMIN" } }),
    prisma.booking.count(),
    prisma.payment
      .aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } })
      .then((r) => r._sum.amount || 0),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.hostel.findMany({
      where: { status: "PENDING_VERIFICATION" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        createdAt: true,
        status: true,
        _count: { select: { rooms: true } },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={`${greeting()}, ${user.name?.split(" ")[0] ?? "Admin"}`}
        description="How HostelHub is doing across every property on the platform"
        action={
          <Button asChild size="sm">
            <Link href="/super-admin/hostels/new">Add hostel</Link>
          </Button>
        }
      />

      <MetricRow>
        <Metric
          label="Properties"
          value={formatNumber(totalHostels)}
          context={`${activeHostels} active · ${pendingHostels} awaiting review`}
          href="/super-admin/hostels"
        />
        <Metric
          label="Hostel admins"
          value={formatNumber(totalAdmins)}
          context="Operators on the platform"
          href="/super-admin/admins"
        />
        <Metric
          label="Platform revenue"
          value={formatCurrencyCompact(totalRevenue)}
          context={`${formatNumber(totalBookings)} bookings all time`}
          href="/super-admin/analytics"
        />
        <Metric
          label="Active subscriptions"
          value={formatNumber(activeSubscriptions)}
          context={
            totalHostels > 0
              ? `${Math.round((activeSubscriptions / totalHostels) * 100)}% of properties`
              : "No properties yet"
          }
        />
      </MetricRow>

      <Panel>
        <PanelHeader
          title="Awaiting verification"
          description="These properties can't take bookings until they're reviewed"
          icon={ShieldCheck}
          action={
            <Button asChild variant="ghost" size="xs">
              <Link href="/super-admin/hostels">
                All properties
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          }
        />

        {awaitingReview.length === 0 ? (
          <EmptyState
            variant="inline"
            icon={ShieldCheck}
            title="Nothing waiting for review"
            description="Every property on the platform has been verified."
          />
        ) : (
          <ul className="divide-y divide-border">
            {awaitingReview.map((hostel) => (
              <li key={hostel.id}>
                <Link
                  href={`/super-admin/hostels/${hostel.id}/edit`}
                  className="flex items-center gap-3 px-3 py-2.5 transition-ui hover:bg-muted/60"
                >
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{hostel.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {hostel.city}, {hostel.state} · {hostel._count.rooms} room
                      {hostel._count.rooms === 1 ? "" : "s"} · submitted{" "}
                      {formatDate(hostel.createdAt)}
                    </p>
                  </div>
                  <StatusBadge registry={HOSTEL_STATUS} value={hostel.status} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
