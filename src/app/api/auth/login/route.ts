import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getAuthCredentials,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "");
  const password = String(body.password || "");
  const creds = getAuthCredentials();

  if (!creds.password) {
    return NextResponse.json(
      { error: "AUTH_PASSWORD nie jest ustawione w środowisku" },
      { status: 500 }
    );
  }

  if (username !== creds.username || password !== creds.password) {
    return NextResponse.json(
      { error: "Nieprawidłowy login lub hasło" },
      { status: 401 }
    );
  }

  const token = await createSessionToken(username);
  const res = NextResponse.json({ ok: true, username });
  setSessionCookie(res, token);
  return res;
}
