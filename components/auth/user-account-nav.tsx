"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, Building } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getDashboardPath } from "@/lib/route-access";

export function UserAccountNav() {
  const { data: session, status } = useSession();
  const { logout } = useAuth();
  const pathname = usePathname();
  const user = session?.user;

  // Don't show anything while loading
  if (status === "loading") return null;

  // Hide login/signup buttons on auth pages
  const isAuthPage = pathname?.startsWith("/auth");

  if (!user) {
    // Don't show login/signup buttons on auth pages
    if (isAuthPage) return null;

    return (
      <div className="flex items-center gap-4">
        <Link href="/auth/login">
          <Button variant="outline" size="sm">
            Log in
          </Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="default" size="sm">
            Sign up
          </Button>
        </Link>
      </div>
    );
  }

  const getInitials = (name?: string | null) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "U";

  const menuItems = [
    {
      label: "Dashboard",
      href: getDashboardPath(user.role),
      icon: user.role === "STUDENT" ? User : Building,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full ring-offset-background transition-shadow hover:ring-2 hover:ring-primary/20 hover:ring-offset-2"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image || ""} alt={user.name || "User"} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.image || ""} alt={user.name || "User"} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              {user.name && (
                <p className="truncate text-sm font-medium leading-none">{user.name}</p>
              )}
              {user.email && (
                <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
              )}
              <span className="mt-1.5 w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium capitalize text-primary">
                {user.role.replace("_", " ").toLowerCase()}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {menuItems.map(({ label, href, icon: Icon }) => (
          <DropdownMenuItem asChild key={label}>
            <Link href={href} className="flex w-full items-center gap-2 text-sm cursor-pointer">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logout}
          className="flex items-center gap-2 text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
