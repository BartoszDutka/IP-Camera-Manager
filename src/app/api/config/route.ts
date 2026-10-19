import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    go2rtcPublicUrl: (
      process.env.NEXT_PUBLIC_GO2RTC_URL ||
      process.env.GO2RTC_PUBLIC_URL ||
      "http://localhost:1984"
    ).replace(/\/$/, ""),
  });
}
