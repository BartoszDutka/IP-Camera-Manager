import { digestFetch } from "./digest-fetch";
import type { Camera, PtzDirection } from "./types";

function parseRtspAuth(rtspUrl: string) {
  try {
    const u = new URL(rtspUrl);
    return {
      host: u.hostname,
      user: decodeURIComponent(u.username || ""),
      password: decodeURIComponent(u.password || ""),
    };
  } catch {
    return { host: "", user: "", password: "" };
  }
}

function resolveCreds(camera: Camera) {
  const fromUrl = parseRtspAuth(camera.rtspUrl);
  return {
    host: (camera.ptzHost || fromUrl.host).replace(/^https?:\/\//, ""),
    user: camera.ptzUser || fromUrl.user,
    password: camera.ptzPassword || fromUrl.password,
  };
}

async function cameraFetch(
  url: string,
  creds: { user: string; password: string },
  init: RequestInit = {}
) {
  const res = await digestFetch(url, {
    ...init,
    username: creds.user,
    password: creds.password,
    signal: init.signal ?? AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Kamera PTZ HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
  }
  return res;
}

const DAHUA_CODE: Record<Exclude<PtzDirection, "stop">, string> = {
  left: "Left",
  right: "Right",
  up: "Up",
  down: "Down",
  upleft: "LeftUp",
  upright: "RightUp",
  downleft: "LeftDown",
  downright: "RightDown",
  zoomin: "ZoomTele",
  zoomout: "ZoomWide",
};

async function dahuaPtz(camera: Camera, direction: PtzDirection, speed = 4) {
  const creds = resolveCreds(camera);
  if (!creds.host) throw new Error("Brak hosta PTZ");

  if (direction === "stop") {
    await cameraFetch(
      `http://${creds.host}/cgi-bin/ptz.cgi?action=stop&channel=0&code=Left&arg1=0&arg2=${speed}&arg3=0`,
      creds
    );
    return;
  }

  const code = DAHUA_CODE[direction];
  await cameraFetch(
    `http://${creds.host}/cgi-bin/ptz.cgi?action=start&channel=0&code=${code}&arg1=0&arg2=${speed}&arg3=0`,
    creds
  );
}

function hikVelocity(direction: PtzDirection, speed: number) {
  let pan = 0;
  let tilt = 0;
  let zoom = 0;

  if (direction === "stop") return { pan, tilt, zoom };

  if (direction.includes("left")) pan = -speed;
  if (direction.includes("right")) pan = speed;
  if (direction === "up" || direction === "upleft" || direction === "upright") {
    tilt = speed;
  }
  if (
    direction === "down" ||
    direction === "downleft" ||
    direction === "downright"
  ) {
    tilt = -speed;
  }
  if (direction === "zoomin") zoom = speed;
  if (direction === "zoomout") zoom = -speed;

  return { pan, tilt, zoom };
}

async function hikvisionPtz(
  camera: Camera,
  direction: PtzDirection,
  speed = 40
) {
  const creds = resolveCreds(camera);
  if (!creds.host) throw new Error("Brak hosta PTZ");

  const { pan, tilt, zoom } = hikVelocity(direction, speed);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<PTZData>
  <pan>${pan}</pan>
  <tilt>${tilt}</tilt>
  <zoom>${zoom}</zoom>
</PTZData>`;

  await cameraFetch(
    `http://${creds.host}/ISAPI/PTZCtrl/channels/1/continuous`,
    creds,
    {
      method: "PUT",
      headers: { "Content-Type": "application/xml" },
      body,
    }
  );
}

async function onvifPtz(camera: Camera, direction: PtzDirection, speed = 0.5) {
  const creds = resolveCreds(camera);
  if (!creds.host) throw new Error("Brak hosta PTZ");

  let x = 0;
  let y = 0;
  let z = 0;

  if (direction !== "stop") {
    if (direction.includes("left")) x = -speed;
    if (direction.includes("right")) x = speed;
    if (direction === "up" || direction === "upleft" || direction === "upright") {
      y = speed;
    }
    if (
      direction === "down" ||
      direction === "downleft" ||
      direction === "downright"
    ) {
      y = -speed;
    }
    if (direction === "zoomin") z = speed;
    if (direction === "zoomout") z = -speed;
  }

  const body =
    direction === "stop"
      ? `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl">
  <s:Body>
    <tptz:Stop>
      <tptz:ProfileToken>Profile_1</tptz:ProfileToken>
      <tptz:PanTilt>true</tptz:PanTilt>
      <tptz:Zoom>true</tptz:Zoom>
    </tptz:Stop>
  </s:Body>
</s:Envelope>`
      : `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl" xmlns:tt="http://www.onvif.org/ver10/schema">
  <s:Body>
    <tptz:ContinuousMove>
      <tptz:ProfileToken>Profile_1</tptz:ProfileToken>
      <tptz:Velocity>
        <tt:PanTilt x="${x}" y="${y}"/>
        <tt:Zoom x="${z}"/>
      </tptz:Velocity>
    </tptz:ContinuousMove>
  </s:Body>
</s:Envelope>`;

  await cameraFetch(`http://${creds.host}/onvif/ptz_service`, creds, {
    method: "POST",
    headers: {
      "Content-Type": "application/soap+xml",
      SOAPAction: direction === "stop" ? "Stop" : "ContinuousMove",
    },
    body,
  });
}

export async function sendPtzCommand(
  camera: Camera,
  direction: PtzDirection,
  speed?: number
) {
  if (camera.ptzType === "none") {
    throw new Error("Ta kamera nie ma włączonego PTZ");
  }

  switch (camera.ptzType) {
    case "dahua":
      return dahuaPtz(camera, direction, speed ?? 4);
    case "hikvision":
      return hikvisionPtz(camera, direction, speed ?? 40);
    case "onvif":
      return onvifPtz(camera, direction, speed ?? 0.5);
    default:
      throw new Error("Nieznany typ PTZ");
  }
}
