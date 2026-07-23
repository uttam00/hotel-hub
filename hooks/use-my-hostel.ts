import { useEffect, useState } from "react";
import { hostelAdminApi } from "@/services/api";

export function useMyHostel() {
  const [hostel, setHostel] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hostelAdminApi
      .getMyHostel()
      .then(setHostel)
      .catch(() => setHostel(null))
      .finally(() => setLoading(false));
  }, []);

  return { hostel, loading };
}
