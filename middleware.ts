import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { Role } from "@prisma/client";

// Define role-based route access
const roleAccess = {
  SUPER_ADMIN: ["/super-admin"],
  HOSTEL_ADMIN: ["/hostel-admin"],
  STUDENT: ["/dashboard"],
} as const;

// Routes accessible by all authenticated users
const sharedAuthRoutes = ["/profile", "/settings"];

// Helper function to get the appropriate dashboard path based on role
function getDashboardPath(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin";
    case "HOSTEL_ADMIN":
      return "/hostel-admin";
    case "STUDENT":
      return "/dashboard";
    default:
      return "/";
  }
}

// Helper function to check if a path is accessible for a role
function isPathAccessible(path: string, role: Role): boolean {
  // Shared routes are accessible by all authenticated users
  if (sharedAuthRoutes.some((route) => path.startsWith(route))) {
    return true;
  }

  const allowedPaths = roleAccess[role as keyof typeof roleAccess] || [];
  return allowedPaths.some((allowedPath) => path.startsWith(allowedPath));
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role as Role;

    // Handle auth routes - redirect to appropriate dashboard if already logged in
    if (path.startsWith("/auth") && role) {
      return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
    }

    // Handle protected routes
    if (
      path.startsWith("/dashboard") ||
      path.startsWith("/hostel-admin") ||
      path.startsWith("/super-admin") ||
      path.startsWith("/profile") ||
      path.startsWith("/settings")
    ) {
      // Redirect to login if not authenticated
      if (!token) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }

      // Check if the path is accessible for the user's role
      if (!isPathAccessible(path, role)) {
        return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Allow public access to auth pages
        if (path.startsWith("/auth")) {
          return true;
        }
        // Require authentication for all other matched routes
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*",
    "/hostel-admin/:path*",
    "/super-admin/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
