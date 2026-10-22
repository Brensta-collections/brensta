import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const needsAuth = pathname.startsWith("/account") || pathname.startsWith("/checkout");
  const needsAdmin = pathname.startsWith("/admin");

  if (needsAuth && !req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (needsAdmin) {
    if (!req.auth) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    const role = req.auth.user?.role;
    if (role !== "ADMIN" && role !== "STAFF") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/admin/:path*"],
};
