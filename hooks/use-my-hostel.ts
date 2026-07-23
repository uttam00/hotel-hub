import { useEffect, useState } from "react";

export function useMyHostel() {
  const [hostel, setHostel] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hostel-admin/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setHostel)
      .finally(() => setLoading(false));
  }, []);

  return { hostel, loading };
}
