"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BrandSpinner } from "@/components/ui/brand-spinner";
import { subscriptionApi } from "@/services/api";
import { PageHeader } from "@/components/layout/page-header";
import { useMyHostel } from "@/hooks/use-my-hostel";
import { CheckCircle2, Lock, Unlock } from "lucide-react";

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
    <div className="space-y-6">
      <PageHeader title="Billing" description="Manage your HostelHub subscription" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Plan
            {confirming ? (
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <BrandSpinner size="sm" /> Confirming...
              </Badge>
            ) : (
              subscription && (
                <Badge variant={isActive ? "default" : "secondary"}>
                  {subscription.status}
                </Badge>
              )
            )}
          </CardTitle>
          <CardDescription>
            {confirming
              ? "Payment received — this can take a few seconds to confirm."
              : subscription
              ? `${subscription.plan === "MONTHLY" ? "Monthly" : "Yearly"} plan, ${
                  isActive ? "renews" : "expired"
                } ${new Date(subscription.endDate).toLocaleDateString()}`
              : "You don't have an active subscription yet."}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isActive ? "What's unlocked" : "What renewing unlocks"}
          </CardTitle>
          <CardDescription>
            {isActive
              ? "Your subscription is active, so these are all available:"
              : "These are paused until you subscribe or renew:"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {GATED_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                {isActive ? (
                  <Unlock className="h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={isActive ? "" : "text-muted-foreground"}>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.label}</CardTitle>
              <CardDescription>{plan.blurb}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{plan.price}</p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={checkingOut !== null}
                onClick={() => handleSubscribe(plan.id)}
              >
                {checkingOut === plan.id ? (
                  <span className="flex items-center gap-2">
                    <BrandSpinner size="sm" />
                    Redirecting...
                  </span>
                ) : subscription?.plan === plan.id && isActive ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Renew
                  </span>
                ) : (
                  "Subscribe"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
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
