import { NextRequest, NextResponse } from "next/server";
import { getCamera } from "@/lib/db";
import { sendPtzCommand } from "@/lib/ptz";
import type { PtzDirection } from "@/lib/types";

const DIRECTIONS: PtzDirection[] = [
  "left",
  "right",
  "up",
  "down",
  "upleft",
  "upright",
  "downleft",
  "downright",
  "zoomin",
  "zoomout",
  "stop",
];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const camera = await getCamera(params.id);
  if (!camera) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const direction = body.direction as PtzDirection;
  if (!DIRECTIONS.includes(direction)) {
    return NextResponse.json(
      { error: "Nieprawidłowy kierunek PTZ" },
      { status: 400 }
    );
  }

  try {
    await sendPtzCommand(camera, direction, body.speed);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Błąd PTZ";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
