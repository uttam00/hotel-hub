import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { HostelAdminDashboardStats } from "@/components/hostel-admin/HostelAdminDashboardStats";
import { getCurrentUser } from "@/lib/auth";

export default async function HostelAdminDashboard() {
  const user = await getCurrentUser();

  if (!user || user.role !== Role.HOSTEL_ADMIN) {
    redirect("/");
  }

  // The command centre supplies its own hero heading, so no PageHeader here.
  return <HostelAdminDashboardStats />;
}
