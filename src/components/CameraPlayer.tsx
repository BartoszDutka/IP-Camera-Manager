"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Camera } from "@/lib/types";
import { IconMic, IconMicOff } from "./icons";
import { PtzPad } from "./PtzPad";

type Props = {
  camera: Camera;
  onEdit: () => void;
  onDelete: () => void;
};

function streamName(cameraId: string) {
  return `cam_${cameraId.replace(/-/g, "")}`;
}

export function CameraPlayer({ camera, onEdit, onDelete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [audioOn, setAudioOn] = useState(false);
  const [status, setStatus] = useState<"loading" | "live" | "error">("loading");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [go2rtcBase, setGo2rtcBase] = useState(
    "http://itr.igrabka.instytut:50005/go2rtc"
  );
  const [tick, setTick] = useState(0);

  const name = useMemo(() => streamName(camera.id), [camera.id]);

  const mp4Url = useMemo(() => {
    const base = go2rtcBase.replace(/\/$/, "");
    return `${base}/api/stream.mp4?src=${encodeURIComponent(name)}&t=${tick}`;
  }, [go2rtcBase, name, tick]);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      setStatus("loading");
      try {
        const streamRes = await fetch(
          `/api/stream/${camera.id}?audio=${audioOn ? "1" : "0"}`
        );
        if (streamRes.ok) {
          const info = await streamRes.json();
          if (info.go2rtcBase && !cancelled) {
            setGo2rtcBase(String(info.go2rtcBase).replace(/\/$/, ""));
          }
        }
      } catch {
        /* sync best-effort */
      }
      if (!cancelled) setTick((n) => n + 1);
    }

    prepare();
    return () => {
      cancelled = true;
    };
  }, [camera.id, audioOn]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !audioOn;
    const onPlaying = () => setStatus("live");
    const onError = () => setStatus("error");
    const onWaiting = () => setStatus((s) => (s === "live" ? s : "loading"));

    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);
    video.addEventListener("waiting", onWaiting);

    video.load();
    video.play().catch(() => undefined);

    const failSafe = setTimeout(() => {
      if (video.readyState < 2) setStatus("error");
    }, 12000);

    return () => {
      clearTimeout(failSafe);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      video.removeEventListener("waiting", onWaiting);
    };
  }, [mp4Url, audioOn]);

  useEffect(() => {
    const onFs = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  async function toggleFullscreen() {
    const el = stageRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      /* browser may block */
    }
  }

  return (
    <article className="panel animate-fade-up overflow-hidden">
      <div
        ref={stageRef}
        className="relative aspect-video cursor-pointer bg-ink-950"
        onClick={toggleFullscreen}
        title="Kliknij, aby przełączyć pełny ekran"
      >
        <video
          key={mp4Url}
          ref={videoRef}
          className="h-full w-full object-contain"
          src={mp4Url}
          playsInline
          autoPlay
          muted={!audioOn}
          controls={false}
        />

        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-ink-950/70 px-2.5 py-1 text-xs text-white backdrop-blur">
          <span className="h-2 w-2 animate-pulse-live rounded-full bg-red-500" />
          LIVE
        </div>

        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur">
          {isFullscreen ? "Kliknij, aby wyjść" : "Kliknij = pełny ekran"}
        </div>

        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink-950/50 text-sm text-white">
            Łączenie ze streamem…
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950/80 p-4 text-center text-sm text-white">
            <p>Nie udało się odtworzyć w przeglądarce.</p>
            <a
              className="btn-primary"
              href={`${go2rtcBase.replace(/\/$/, "")}/stream.html?src=${encodeURIComponent(
                name
              )}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Otwórz w go2rtc
            </a>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-ink-950">
            {camera.name}
          </h3>
          <p className="mt-0.5 truncate font-mono text-xs text-ink-400">
            {camera.rtspUrl.replace(/:[^:@]+@/, ":••••@")}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn-ghost ${audioOn ? "ring-signal text-signal-dark" : ""}`}
              onClick={() => setAudioOn((v) => !v)}
              title={audioOn ? "Wycisz audio" : "Włącz audio"}
            >
              {audioOn ? <IconMic /> : <IconMicOff />}
              {audioOn ? "Audio włączone" : "Wyciszone"}
            </button>
            <button type="button" className="btn-ghost" onClick={onEdit}>
              Edytuj
            </button>
            <button type="button" className="btn-danger" onClick={onDelete}>
              Usuń
            </button>
          </div>
        </div>

        <div className="shrink-0">
          <PtzPad cameraId={camera.id} disabled={camera.ptzType === "none"} />
        </div>
      </div>
    </article>
  );
}
