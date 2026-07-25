import { HostelAdminDashboardStats } from "@/components/hostel-admin/HostelAdminDashboardStats";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function HostelAdminDashboard() {
  const user = await getCurrentUser();

  if (!user || user.role !== Role.HOSTEL_ADMIN) {
    redirect("/");
  }

  return (
    <div className="container mx-auto pb-8">
      <h1 className="text-2xl font-bold mb-8">Hostel Admin Dashboard</h1>
      <HostelAdminDashboardStats />
    </div>
  );
}
