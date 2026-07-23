import { useCallback, useEffect, useState } from "react";

// Generic list/resource loader around any service-layer call. Pass `null`
// for `fetcher` to skip loading (e.g. while a dependency like the current
// hostel is still loading). `deps` re-runs the fetcher when they change,
// same as a useEffect dependency array.
export function useFetch<T>(fetcher: (() => Promise<T>) | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!fetcher) return;
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
