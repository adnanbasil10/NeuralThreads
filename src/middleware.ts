import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenEdge } from "@/lib/auth/jwt-edge";
import { COOKIE_NAME } from "@/lib/auth/jwt";

const protectedRoutes = ["/customer", "/designer", "/tailor"];
const authRoutes = ["/login", "/signup"];

const roleDashboards: Record<string, string> = {
  CUSTOMER: "/customer",
  DESIGNER: "/designer",
  TAILOR: "/tailor",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Early return for static assets and API routes (no auth needed)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Verify token only if present
  let user = null;
  if (token) {
    try {
      user = verifyTokenEdge(token);
    } catch {
      user = null;
    }
  }

  // Check route types
  const isProtected = protectedRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isAuthRoute = authRoutes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  // Create response with proper cache headers
  const response = NextResponse.next();
  
  // Prevent caching of auth and protected routes
  if (isProtected || isAuthRoute) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  // Handle protected routes - redirect to login if not authenticated
  if (isProtected && !user) {
    // Prevent redirect loops - only redirect if not already going to login
    if (pathname !== "/login") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Handle auth routes - redirect to dashboard if already authenticated
  if (isAuthRoute && user) {
    const dashboard = roleDashboards[user.role] || "/customer";
    // Prevent redirect loops - only redirect if not already at correct dashboard
    if (!pathname.startsWith(dashboard)) {
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    return response;
  }

  // Handle role-based access control - redirect to correct dashboard
  if (user && isProtected) {
    const userDashboard = roleDashboards[user.role];
    if (userDashboard && !pathname.startsWith(userDashboard)) {
      // Prevent redirect loops
      if (pathname !== userDashboard && !pathname.startsWith(userDashboard + "/")) {
        return NextResponse.redirect(new URL(userDashboard, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/designer/:path*",
    "/tailor/:path*",
    "/login/:path*",
    "/signup/:path*",
  ],
};
