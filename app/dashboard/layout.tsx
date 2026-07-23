import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminLayoutShell } from "@/components/common-in-admin/AdminLayoutShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "STUDENT") {
    redirect("/");
  }

  return (
    <AdminLayoutShell role={user.role} sidebarClassName="hidden md:flex w-64 flex-col border-r">
      {children}
    </AdminLayoutShell>
  );
}
