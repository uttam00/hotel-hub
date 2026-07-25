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
import { CheckCircle2 } from "lucide-react";

const PLANS: { id: "MONTHLY" | "YEARLY"; label: string; price: string; blurb: string }[] = [
  { id: "MONTHLY", label: "Monthly", price: "₹999/month", blurb: "Billed every month, cancel anytime." },
  { id: "YEARLY", label: "Yearly", price: "₹9,999/year", blurb: "About 2 months free versus monthly." },
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
  const [checkingOut, setCheckingOut] = useState<"MONTHLY" | "YEARLY" | null>(null);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") toast.success("Payment received — your subscription is active.");
    if (checkout === "cancelled") toast.error("Checkout was cancelled.");
  }, [searchParams]);

  const fetchSubscription = async () => {
    if (!hostel) return;
    try {
      setLoading(true);
      const result = await subscriptionApi.get(hostel.id);
      setData(result);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostel]);

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
            {subscription && (
              <Badge variant={isActive ? "default" : "secondary"}>
                {subscription.status}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {subscription
              ? `${subscription.plan === "MONTHLY" ? "Monthly" : "Yearly"} plan, ${
                  isActive ? "renews" : "expired"
                } ${new Date(subscription.endDate).toLocaleDateString()}`
              : "You don't have an active subscription yet."}
          </CardDescription>
        </CardHeader>
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
