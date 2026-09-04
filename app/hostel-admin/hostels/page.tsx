"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import HostelManagement from "@/components/common-in-admin/HostelManagement";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/hooks/use-auth";
import { hostelApi } from "@/services/api";
import type { Hostel } from "@/types";

export default function HostelsPage() {
  const { user } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hostelApi
      .getMine({ limit: 100 })
      .then((response) => setHostels(response.data))
      .catch(() => toast.error("Failed to fetch hostels"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Hostels"
        description="Your properties, their rooms and their details"
        breadcrumbs={[{ label: "Property" }, { label: "Hostels" }]}
      />
      <HostelManagement hostels={hostels} userRole={user?.role ?? ""} loading={loading} />
    </div>
  );
}
