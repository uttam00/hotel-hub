"use client";

import { ArrowLeft } from "lucide-react";
import { Role } from "@prisma/client";

import { SidebarNavLink } from "@/components/common-in-admin/SidebarNavLink";
import { getDashboardPath } from "@/lib/route-access";

/**
 * Pinned escape hatch for pages whose sidebar shows a section nav instead of
 * the main one (e.g. /profile), where there would otherwise be no way back to
 * the dashboard from the sidebar at all.
 */
export function BackToDashboardLink({
  role,
  collapsed = false,
}: {
  role: Role;
  collapsed?: boolean;
}) {
  return (
    <SidebarNavLink
      href={getDashboardPath(role)}
      icon={ArrowLeft}
      label="Back to dashboard"
      active={false}
      collapsed={collapsed}
    />
  );
}
