import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "mh_session";

function secretKey() {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv) return new TextEncoder().encode(fromEnv);
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return new TextEncoder().encode(
    "mora-hueso-dev-secret-change-in-production"
  );
}

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  const key = secretKey();
  if (!key) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, key);
    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
