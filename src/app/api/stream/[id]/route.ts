import { NextRequest, NextResponse } from "next/server";
import { getCamera } from "@/lib/db";
import { publicStreamUrl, streamName, syncCameraStream } from "@/lib/go2rtc";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const camera = await getCamera(params.id);
  if (!camera) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  const withAudio = req.nextUrl.searchParams.get("audio") !== "0";
  await syncCameraStream(camera);

  const go2rtcBase = (
    process.env.GO2RTC_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_GO2RTC_URL ||
    "http://localhost:1984"
  ).replace(/\/$/, "");

  return NextResponse.json({
    cameraId: camera.id,
    streamName: streamName(camera.id),
    embedUrl: publicStreamUrl(camera.id, withAudio),
    go2rtcBase,
    withAudio,
  });
}
