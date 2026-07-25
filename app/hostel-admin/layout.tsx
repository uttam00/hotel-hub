import { AdminLayoutShell } from "@/components/common-in-admin/AdminLayoutShell";
import { HostelSelectorBar } from "@/components/hostel-admin/HostelSelectorBar";
import { SubscriptionBanner } from "@/components/hostel-admin/SubscriptionBanner";
import { HostelProvider } from "@/contexts/hostel-context";
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
    <HostelProvider>
      <AdminLayoutShell
        role={user.role}
        topSlot={<SubscriptionBanner />}
        sidebarTopSlot={<HostelSelectorBar />}
      >
        {children}
      </AdminLayoutShell>
    </HostelProvider>
  );
}
