"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import HostelForm from "@/components/hostel/HostelForm";
import { PageHeader } from "@/components/layout/page-header";
import { hostelApi } from "@/services/api";

/**
 * Lets a hostel admin add their own property.
 *
 * The API has always permitted this — POST /api/hostels accepts HOSTEL_ADMIN
 * and connects the creator as an admin of the new hostel — but the only page
 * for it lived under /super-admin, which middleware blocks for this role. A
 * self-registered admin therefore had no way to get a hostel at all, which is
 * what left the console with nothing to load.
 */
export default function NewHostelPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      return await hostelApi.create(data);
    } catch (error) {
      console.error("Error creating hostel:", error);
      toast.error("Failed to create hostel");
      throw error;
    }
  };

  const handleSuccess = () => {
    toast.success("Hostel created");
    // Full reload rather than router.push: the hostel context is populated once
    // on mount, so a client-side navigation would land on a console that still
    // believes this admin has no property.
    window.location.href = "/hostel-admin";
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Add your hostel"
        description="Tell us about the property, then add its rooms and start taking bookings."
        breadcrumbs={[
          { label: "Property" },
          { label: "Hostels", href: "/hostel-admin/hostels" },
          { label: "New" },
        ]}
      />
      <HostelForm onSubmit={handleSubmit} onSuccess={handleSuccess} />
    </div>
  );
}
