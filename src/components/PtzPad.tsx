"use client";

import { useState } from "react";
import type { PtzDirection } from "@/lib/types";

type Props = {
  cameraId: string;
  disabled?: boolean;
};

async function send(cameraId: string, direction: PtzDirection) {
  const res = await fetch(`/api/cameras/${cameraId}/ptz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ direction }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Błąd PTZ (${res.status})`);
  }
}

function PadBtn({
  label,
  onDown,
  onUp,
  className = "",
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-800 active:scale-95 disabled:opacity-40 ${className}`}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={(e) => {
        e.preventDefault();
        onDown();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onUp();
      }}
    >
      {label}
    </button>
  );
}

export function PtzPad({ cameraId, disabled }: Props) {
  const [error, setError] = useState("");

  if (disabled) {
    return (
      <p className="text-xs text-ink-400">PTZ wyłączone dla tej kamery</p>
    );
  }

  const run = (dir: PtzDirection) => async () => {
    try {
      setError("");
      await send(cameraId, dir);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd PTZ");
    }
  };

  const hold = (dir: PtzDirection) => run(dir);
  const stop = run("stop");

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        Sterowanie PTZ
      </p>
      <p className="max-w-[11rem] text-[11px] leading-snug text-ink-400">
        Przytrzymaj strzałkę — kamera rusza. Puść = stop. Typ: Hikvision ISAPI.
      </p>
      <div className="grid w-fit grid-cols-3 gap-1.5">
        <PadBtn label="↖" onDown={hold("upleft")} onUp={stop} />
        <PadBtn label="↑" onDown={hold("up")} onUp={stop} />
        <PadBtn label="↗" onDown={hold("upright")} onUp={stop} />
        <PadBtn label="←" onDown={hold("left")} onUp={stop} />
        <PadBtn label="●" onDown={stop} onUp={() => undefined} className="bg-signal hover:bg-signal-dark" />
        <PadBtn label="→" onDown={hold("right")} onUp={stop} />
        <PadBtn label="↙" onDown={hold("downleft")} onUp={stop} />
        <PadBtn label="↓" onDown={hold("down")} onUp={stop} />
        <PadBtn label="↘" onDown={hold("downright")} onUp={stop} />
      </div>
      <div className="flex gap-1.5">
        <PadBtn label="＋" onDown={hold("zoomin")} onUp={stop} className="w-auto flex-1 px-3" />
        <PadBtn label="－" onDown={hold("zoomout")} onUp={stop} className="w-auto flex-1 px-3" />
      </div>
      {error && (
        <p className="max-w-[14rem] rounded-lg bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
