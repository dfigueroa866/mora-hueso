import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./db";

const COOKIE = "mh_session";
const secret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || "mora-hueso-dev-secret-change-in-production"
  );

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.email || !payload.name || !payload.role) {
      return null;
    }
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return null;
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export { COOKIE as SESSION_COOKIE };
