import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminLayoutShell } from "@/components/common-in-admin/AdminLayoutShell";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return (
    <AdminLayoutShell role={user.role}>{children}</AdminLayoutShell>
  );
}
