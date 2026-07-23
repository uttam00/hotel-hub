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
    <AdminLayoutShell
      role={user.role}
      menuButtonClassName="text-gray-900 dark:text-white"
      sheetContentClassName="w-[300px] p-0 bg-gray-50/40 dark:bg-gray-900"
    >
      {children}
    </AdminLayoutShell>
  );
}
