import { NextRequest, NextResponse } from "next/server";
import { createCamera, listCameras } from "@/lib/db";
import { syncCameraStream } from "@/lib/go2rtc";
import type { PtzType } from "@/lib/types";

const PTZ: PtzType[] = ["none", "dahua", "hikvision", "onvif"];

export async function GET() {
  const cameras = await listCameras();
  return NextResponse.json(cameras);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const rtspUrl = String(body.rtspUrl || "").trim();

  if (!name || !rtspUrl) {
    return NextResponse.json(
      { error: "Nazwa i URL RTSP są wymagane" },
      { status: 400 }
    );
  }

  if (!rtspUrl.toLowerCase().startsWith("rtsp://")) {
    return NextResponse.json(
      { error: "URL musi zaczynać się od rtsp://" },
      { status: 400 }
    );
  }

  const ptzType: PtzType = PTZ.includes(body.ptzType) ? body.ptzType : "none";

  const camera = await createCamera({
    name,
    rtspUrl,
    categoryId: body.categoryId ? String(body.categoryId) : null,
    ptzType,
    ptzHost: body.ptzHost ? String(body.ptzHost) : undefined,
    ptzUser: body.ptzUser ? String(body.ptzUser) : undefined,
    ptzPassword: body.ptzPassword ? String(body.ptzPassword) : undefined,
    enabled: body.enabled !== false,
  });

  await syncCameraStream(camera);
  return NextResponse.json(camera, { status: 201 });
}
