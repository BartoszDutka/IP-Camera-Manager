import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "cam_session";

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export function getAuthCredentials() {
  return {
    username: process.env.AUTH_USERNAME || "admin",
    password: process.env.AUTH_PASSWORD || "",
  };
}

export async function createSessionToken(username: string) {
  return new SignJWT({ username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as { username: string; role: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

function cookieSecure() {
  // Domyślnie false — strona działa po HTTP (itr.igrabka.instytut:50005)
  return process.env.COOKIE_SECURE === "true";
}

export function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 0,
  });
}

export async function requireAuth(req?: NextRequest) {
  if (req) {
    const token = req.cookies.get(COOKIE)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  }
  return getSession();
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
