"use client";

import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";

import { SidebarNavLink } from "@/components/common-in-admin/SidebarNavLink";
import { getNavSections, isNavItemActive } from "@/components/common-in-admin/nav-config";
import { cn } from "@/lib/utils";

/**
 * The sidebar's grouped navigation. Section headings turn twelve undifferentiated
 * links into five scannable groups, which is the difference between reading the
 * sidebar and searching it.
 */
export function AdminNavigation({
  role,
  collapsed = false,
  onNavigate,
}: {
  role: Role;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = getNavSections(role);

  return (
    <nav className={cn("flex flex-col gap-4", collapsed ? "px-2" : "px-2.5")} aria-label="Main">
      {sections.map((section, i) => (
        <div key={section.label ?? `section-${i}`} className="flex flex-col gap-0.5">
          {section.label &&
            (collapsed ? (
              // Collapsed rail: a rule stands in for the heading, so the
              // grouping survives even when the words can't.
              <span className="mx-auto my-1 h-px w-5 bg-sidebar-border" aria-hidden="true" />
            ) : (
              <h3 className="px-2.5 pb-1 text-2xs font-semibold uppercase tracking-[0.08em] text-sidebar-heading">
                {section.label}
              </h3>
            ))}
          {section.items.map((item) => (
            <SidebarNavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isNavItemActive(item, pathname)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
