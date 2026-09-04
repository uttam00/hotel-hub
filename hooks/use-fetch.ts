import { useCallback, useEffect, useState } from "react";

/**
 * Generic list/resource loader around any service-layer call.
 *
 * Pass `null` for `fetcher` to skip loading — e.g. while a dependency like the
 * current hostel is still resolving, or when there is no hostel to load for at
 * all. `deps` re-runs the fetcher when they change, like a useEffect array.
 */
export function useFetch<T>(fetcher: (() => Promise<T>) | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  // Starts true so the first paint is a skeleton rather than a flash of "empty".
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    // Nothing to fetch is a finished state, not a pending one. Returning early
    // while leaving `loading` true left every page that gates on a dependency
    // — an admin with no hostel assigned, say — showing a skeleton forever.
    if (!fetcher) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Request failed"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
