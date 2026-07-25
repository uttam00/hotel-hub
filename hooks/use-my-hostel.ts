import { useHostelContext } from "@/contexts/hostel-context";

// Thin adapter over HostelProvider so every existing caller keeps working
// unchanged: `hostel` now follows whichever hostel is selected in the
// HostelSelectorBar instead of always being the admin's first hostel.
export function useMyHostel() {
  const { selectedHostel, loading } = useHostelContext();
  return { hostel: selectedHostel, loading };
}
