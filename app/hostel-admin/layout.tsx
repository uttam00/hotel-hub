import { AdminLayoutShell } from "@/components/common-in-admin/AdminLayoutShell";
import { SubscriptionBanner } from "@/components/hostel-admin/SubscriptionBanner";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HostelAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "HOSTEL_ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayoutShell role={user.role} topSlot={<SubscriptionBanner />}>
      {children}
    </AdminLayoutShell>
  );
}
