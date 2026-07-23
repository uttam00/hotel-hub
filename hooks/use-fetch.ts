import { useCallback, useEffect, useState } from "react";

// Generic list/resource fetcher. Pass `null` for `url` to skip fetching
// (e.g. while a dependency like the current hostel is still loading).
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Request failed");
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Request failed"));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
