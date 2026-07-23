"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import HostelForm from "@/components/hostel/HostelForm";
import { hostelApi } from "@/services/api";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function EditHostelPage() {
  const router = useRouter();
  const params: { id: string } = useParams();
  const [hostel, setHostel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHostel = async () => {
      try {
        const data = await hostelApi.getById(params.id);
        setHostel(data);
      } catch (error) {
        console.error("Error fetching hostel:", error);
        toast.error("Failed to fetch hostel details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHostel();
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    try {
      await hostelApi.update(params.id, data);
      toast.success("Hostel updated successfully");
      router.push("/hostel-admin/hostels");
    } catch (error) {
      console.error("Error updating hostel:", error);
      toast.error("Failed to update hostel");
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullPage message="Loading hostel..." />;
  }

  if (!hostel) {
    return <div>Hostel not found</div>;
  }

  return (
    <div className="container mx-auto pb-10">
      <h1 className="text-2xl font-bold mb-8">Edit Hostel</h1>
      <HostelForm initialData={hostel} onSubmit={handleSubmit} />
    </div>
  );
}
