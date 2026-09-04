"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BrandSpinner } from "@/components/ui/brand-spinner";
import { StatusBadge, SUBSCRIPTION_STATUS } from "@/components/ui/status-badge";
import { subscriptionApi } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { formatDate } from "@/lib/format";
import { CheckCircle2, Lock, Unlock, Wallet } from "lucide-react";

const PLANS: { id: "MONTHLY" | "YEARLY"; label: string; price: string; blurb: string }[] = [
  { id: "MONTHLY", label: "Monthly", price: "₹999/month", blurb: "Billed every month, cancel anytime." },
  { id: "YEARLY", label: "Yearly", price: "₹9,999/year", blurb: "About 2 months free versus monthly." },
];

// Kept in sync with the requireFullAccess() call sites in the API routes —
// this is the one place that spells out what a lapsed subscription actually
// blocks, since nothing else in the UI explains it.
const GATED_FEATURES = [
  "Accepting new student bookings",
  "Posting notices to your students",
  "Adding new rooms to your hostel",
];

type SubscriptionData = {
  hostel: { id: string; name: string };
  subscription: {
    plan: "MONTHLY" | "YEARLY";
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    endDate: string;
  } | null;
  accessLevel: "FULL" | "LIMITED";
};

function BillingPageContent() {
  const searchParams = useSearchParams();
  const { hostel, loading: hostelLoading } = useMyHostel();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [checkingOut, setCheckingOut] = useState<"MONTHLY" | "YEARLY" | null>(null);

  const fetchSubscription = async (hostelId: string) => {
    try {
      const result = await subscriptionApi.get(hostelId);
      setData(result);
      return result;
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!hostel) return;
    setLoading(true);
    fetchSubscription(hostel.id).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostel]);

  // Stripe confirms the purchase via an async webhook, so the Subscription
  // row may not exist yet the instant we land back on this page — poll for
  // a few seconds instead of showing "no subscription" until a manual reload.
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "cancelled") {
      toast.error("Checkout was cancelled.");
      return;
    }
    if (checkout !== "success" || !hostel) return;

    let cancelled = false;
    setConfirming(true);
    toast.success("Payment received — confirming your subscription...");

    const poll = async (attempt: number) => {
      const result = await fetchSubscription(hostel.id);
      if (cancelled) return;
      if (result?.accessLevel === "FULL") {
        toast.success("Your subscription is now active!");
        setConfirming(false);
        return;
      }
      if (attempt >= 6) {
        setConfirming(false);
        return;
      }
      setTimeout(() => poll(attempt + 1), 2000);
    };
    poll(1);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, hostel]);

  const handleSubscribe = async (plan: "MONTHLY" | "YEARLY") => {
    if (!hostel) return;
    setCheckingOut(plan);
    try {
      const { url } = await subscriptionApi.checkout(plan, hostel.id);
      window.location.href = url;
    } catch (error) {
      console.error("Error starting checkout:", error);
      toast.error("Failed to start checkout");
      setCheckingOut(null);
    }
  };

  if (hostelLoading || loading) {
    return <LoadingSpinner fullPage message="Loading billing details..." />;
  }

  const subscription = data?.subscription;
  const isActive = data?.accessLevel === "FULL";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Billing"
        description="Your HostelHub subscription"
        breadcrumbs={[{ label: "Finance" }, { label: "Billing" }]}
      />

      {/* Current state first — the question is always "am I covered?" */}
      <Panel>
        <PanelHeader
          title="Current plan"
          icon={Wallet}
          action={
            confirming ? (
              <Badge variant="secondary">
                <BrandSpinner size="sm" />
                Confirming
              </Badge>
            ) : subscription ? (
              <StatusBadge registry={SUBSCRIPTION_STATUS} value={subscription.status} />
            ) : (
              <Badge variant="neutral">No subscription</Badge>
            )
          }
        />
        <div className="p-3">
          <p className="text-sm text-muted-foreground">
            {confirming
              ? "Payment received — this can take a few seconds to confirm."
              : subscription
              ? `${subscription.plan === "MONTHLY" ? "Monthly" : "Yearly"} plan, ${
                  isActive ? "renews" : "expired"
                } ${formatDate(subscription.endDate)}`
              : "You don't have an active subscription yet."}
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title={isActive ? "What's unlocked" : "What renewing unlocks"}
          description={
            isActive
              ? "Your subscription is active, so these are all available"
              : "These are paused until you subscribe or renew"
          }
        />
        <ul className="divide-y divide-border">
          {GATED_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 px-3 py-2">
              {isActive ? (
                <Unlock className="size-4 shrink-0 text-success" />
              ) : (
                <Lock className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className={isActive ? "text-sm" : "text-sm text-muted-foreground"}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = subscription?.plan === plan.id && isActive;
          return (
            <Panel
              key={plan.id}
              className={isCurrent ? "border-primary-border bg-primary-subtle/30" : undefined}
            >
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">{plan.label}</h2>
                    <p className="text-sm text-muted-foreground">{plan.blurb}</p>
                  </div>
                  {isCurrent && <Badge variant="default">Current</Badge>}
                </div>
                <p className="font-mono text-2xl font-semibold tracking-tight">{plan.price}</p>
                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={checkingOut !== null}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {checkingOut === plan.id ? (
                    <>
                      <BrandSpinner size="sm" />
                      Redirecting…
                    </>
                  ) : isCurrent ? (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      Renew
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Loading billing details..." />}>
      <BillingPageContent />
    </Suspense>
  );
}
