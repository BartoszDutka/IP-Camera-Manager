import type { Camera } from "./types";

function baseUrl() {
  return (process.env.GO2RTC_URL || "http://localhost:1984").replace(/\/$/, "");
}

export function streamName(cameraId: string) {
  return `cam_${cameraId.replace(/-/g, "")}`;
}

export function publicStreamUrl(cameraId: string, withAudio: boolean) {
  const publicBase = (
    process.env.NEXT_PUBLIC_GO2RTC_URL || "http://localhost:1984"
  ).replace(/\/$/, "");
  const name = streamName(cameraId);
  // MSE player works well in browsers; audio controlled via query on our player
  return `${publicBase}/stream.html?src=${encodeURIComponent(name)}&media=${
    withAudio ? "video+audio" : "video"
  }`;
}

export function publicWebrtcUrl(cameraId: string) {
  const publicBase = (
    process.env.NEXT_PUBLIC_GO2RTC_URL || "http://localhost:1984"
  ).replace(/\/$/, "");
  return `${publicBase}/api/ws?src=${encodeURIComponent(streamName(cameraId))}`;
}

/** Register / update camera stream in go2rtc */
export async function syncCameraStream(camera: Camera): Promise<void> {
  const name = streamName(camera.id);

  try {
    await fetch(`${baseUrl()}/api/streams?src=${encodeURIComponent(name)}`, {
      method: "DELETE",
    }).catch(() => undefined);

    if (!camera.enabled) return;

    // go2rtc: PUT /api/streams?name=ID&src=rtsp://...
    const putUrl = `${baseUrl()}/api/streams?name=${encodeURIComponent(
      name
    )}&src=${encodeURIComponent(camera.rtspUrl)}`;

    const res = await fetch(putUrl, { method: "PUT" });
    if (!res.ok) {
      await fetch(`${baseUrl()}/api/streams`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [name]: [camera.rtspUrl] }),
      });
    }
  } catch (err) {
    console.warn("go2rtc sync failed:", err);
  }
}

export async function removeCameraStream(cameraId: string): Promise<void> {
  const name = streamName(cameraId);
  try {
    await fetch(`${baseUrl()}/api/streams?src=${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("go2rtc remove failed:", err);
  }
}

export async function syncAllCameras(cameras: Camera[]): Promise<void> {
  for (const cam of cameras) {
    if (cam.enabled) await syncCameraStream(cam);
  }
}
