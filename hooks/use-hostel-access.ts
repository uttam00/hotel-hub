import { useFetch } from "@/hooks/use-fetch";
import { subscriptionApi } from "@/services/api";

// Whether the given hostel currently has FULL or LIMITED access, per
// lib/subscription.ts's getHostelAccessLevel — lets UI proactively disable
// gated actions (posting notices, etc.) instead of failing after submit.
export function useHostelAccessLevel(hostelId: string | undefined) {
  const { data, loading } = useFetch(
    hostelId ? () => subscriptionApi.get(hostelId) : null,
    [hostelId]
  );

  return { accessLevel: data?.accessLevel ?? "FULL", loading };
}
