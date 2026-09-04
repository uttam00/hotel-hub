"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { hostelAdminApi } from "@/services/api";

type HostelSummary = { id: string; name: string };

type HostelContextValue = {
  hostels: HostelSummary[];
  selectedHostel: HostelSummary | null;
  loading: boolean;
  hasMultiple: boolean;
  setSelectedHostelId: (id: string) => void;
};

const STORAGE_KEY = "hostelhub:selectedHostelId";

const HostelContext = createContext<HostelContextValue | null>(null);

// Fetches every hostel the signed-in hostel admin manages and tracks which
// one is "active" across the whole /hostel-admin section, persisted in
// localStorage so the choice survives navigation and page reloads.
export function HostelProvider({ children }: { children: ReactNode }) {
  const [hostels, setHostels] = useState<HostelSummary[]>([]);
  const [selectedHostelId, setSelectedHostelIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    hostelAdminApi
      .getMyHostels()
      .then((list) => {
        if (cancelled) return;
        setHostels(list);

        const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
        const initial = list.find((h) => h.id === stored) ?? list[0] ?? null;
        setSelectedHostelIdState(initial?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setHostels([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setSelectedHostelId = useCallback((id: string) => {
    setSelectedHostelIdState(id);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const selectedHostel = useMemo(
    () => hostels.find((h) => h.id === selectedHostelId) ?? null,
    [hostels, selectedHostelId]
  );

  const value = useMemo(
    () => ({ hostels, selectedHostel, loading, hasMultiple: hostels.length > 1, setSelectedHostelId }),
    [hostels, selectedHostel, loading, setSelectedHostelId]
  );

  return <HostelContext.Provider value={value}>{children}</HostelContext.Provider>;
}

export function useHostelContext() {
  const ctx = useContext(HostelContext);
  if (!ctx) throw new Error("useHostelContext must be used within a HostelProvider");
  return ctx;
}

/**
 * Same context, but null instead of throwing when there is no provider.
 *
 * Only the hostel-admin section is wrapped in HostelProvider; shared chrome
 * (the console header, the command palette) also renders for super admins and
 * students, where there is no "selected hostel" at all.
 */
export function useOptionalHostelContext(): HostelContextValue | null {
  return useContext(HostelContext);
}
