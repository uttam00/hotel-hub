"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import HostelManagement from "@/components/common-in-admin/HostelManagement";
import { Hostel } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { hostelApi } from "@/services/api";

export default function HostelsPage() {
  const { user } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch hostels data
  const fetchHostels = async () => {
    try {
      const response = await hostelApi.getAll();
      setHostels(response.data);
    } catch (error) {
      toast.error("Failed to fetch hostels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  return (
    <div className="container mx-auto pb-8">
      <HostelManagement
        hostels={hostels}
        userRole={user?.role ?? ""}
        loading={loading}
      />
    </div>
  );
}
