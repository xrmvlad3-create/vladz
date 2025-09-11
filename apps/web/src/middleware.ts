import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Protect /admin with server-side checks.
 * Redirects unauthenticated users to /login?callbackUrl=/admin
 * If NEXTAUTH_SECRET is missing, we conservatively redirect to /login.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    try {
      const token = await getToken({ req, secret });
      const role = (token as any)?.role ?? "guest";

      if (!token || role !== "admin") {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};