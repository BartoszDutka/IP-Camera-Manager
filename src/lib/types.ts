export type PtzType = "none" | "dahua" | "hikvision" | "onvif";

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Camera {
  id: string;
  name: string;
  rtspUrl: string;
  categoryId: string | null;
  ptzType: PtzType;
  /** Host for PTZ HTTP calls (defaults to host extracted from RTSP) */
  ptzHost?: string;
  /** Optional ONVIF username (defaults to RTSP user) */
  ptzUser?: string;
  /** Optional ONVIF password (defaults to RTSP password) */
  ptzPassword?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  categories: Category[];
  cameras: Camera[];
}

export type PtzDirection =
  | "left"
  | "right"
  | "up"
  | "down"
  | "upleft"
  | "upright"
  | "downleft"
  | "downright"
  | "zoomin"
  | "zoomout"
  | "stop";
