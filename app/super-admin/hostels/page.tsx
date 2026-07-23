"use client";

import HostelManagement from "@/components/common-in-admin/HostelManagement";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { hostelApi } from "@/services/api";
import { Hostel } from "@/types";
import { useEffect, useState } from "react";

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
        userRole={user ? user.role : ""}
        loading={loading}
      />
    </div>
  );
}
