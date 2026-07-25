"use client";

import { ArrowLeft } from "lucide-react";
import { Role } from "@prisma/client";
import { SidebarNavLink } from "@/components/common-in-admin/SidebarNavLink";
import { getDashboardPath } from "@/lib/route-access";

// Split out as its own client component because AdminLayoutShell (its only
// caller) is a Server Component — passing the ArrowLeft icon reference
// straight into the client-side SidebarNavLink from there crosses the
// server/client boundary with a non-serializable value ("Only plain objects
// can be passed to Client Components from Server Components"). Keeping the
// icon entirely inside a client component avoids that.
export function BackToDashboardLink({ role }: { role: Role }) {
  return (
    <div className="border-t border-border/40 p-2">
      <SidebarNavLink href={getDashboardPath(role)} icon={ArrowLeft} label="Back to Dashboard" active={false} />
    </div>
  );
}
