import { NextRequest, NextResponse } from "next/server";
import { deleteCamera, getCamera, updateCamera } from "@/lib/db";
import { removeCameraStream, syncCameraStream } from "@/lib/go2rtc";
import type { PtzType } from "@/lib/types";

const PTZ: PtzType[] = ["none", "dahua", "hikvision", "onvif"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const camera = await getCamera(params.id);
  if (!camera) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }
  return NextResponse.json(camera);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (body.name !== undefined) patch.name = String(body.name);
  if (body.rtspUrl !== undefined) patch.rtspUrl = String(body.rtspUrl);
  if (body.categoryId !== undefined) {
    patch.categoryId = body.categoryId ? String(body.categoryId) : null;
  }
  if (body.ptzType !== undefined && PTZ.includes(body.ptzType)) {
    patch.ptzType = body.ptzType;
  }
  if (body.ptzHost !== undefined) patch.ptzHost = String(body.ptzHost || "");
  if (body.ptzUser !== undefined) patch.ptzUser = String(body.ptzUser || "");
  if (body.ptzPassword !== undefined)
    patch.ptzPassword = String(body.ptzPassword || "");
  if (body.enabled !== undefined) patch.enabled = Boolean(body.enabled);

  if (patch.rtspUrl && !String(patch.rtspUrl).toLowerCase().startsWith("rtsp://")) {
    return NextResponse.json(
      { error: "URL musi zaczynać się od rtsp://" },
      { status: 400 }
    );
  }

  const camera = await updateCamera(params.id, patch);
  if (!camera) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  await syncCameraStream(camera);
  return NextResponse.json(camera);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ok = await deleteCamera(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }
  await removeCameraStream(params.id);
  return NextResponse.json({ ok: true });
}
