import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { Role } from "@prisma/client";
import { getDashboardPath, isPathAccessible } from "@/lib/route-access";

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
      path.startsWith("/profile")
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
  ],
};
