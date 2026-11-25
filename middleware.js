import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PAGES = ["/dashboard", "/resume"];
const PROTECTED_API = ["/api/resumes", "/api/canva"];

// These API routes must be PUBLIC — they are called by external services (Canva OAuth)
// or don't require authentication by design
const PUBLIC_API_EXCEPTIONS = ["/api/canva/callback"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Skip middleware entirely for public API exceptions
  if (PUBLIC_API_EXCEPTIONS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p));
  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p));

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    if (isProtectedApi) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    if (isProtectedApi) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/resume/:path*",
    "/api/resumes/:path*",
    "/api/canva/:path*",
  ],
};
