import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const user = req.auth?.user;
  const isApi = path.startsWith("/api/");
  const needsAdmin = path.startsWith("/admin") || path.startsWith("/api/admin");
  const needsUser = needsAdmin || /^\/(profile|my-list)(\/|$)/.test(path) || path.startsWith("/api/me");

  if (needsUser && !user) {
    if (isApi) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", path + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (needsAdmin && user?.role !== "ADMIN") {
    if (isApi) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/me/:path*", "/profile/:path*", "/my-list/:path*"],
};
