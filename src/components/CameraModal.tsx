"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Camera, Category, PtzType } from "@/lib/types";

type Props = {
  open: boolean;
  categories: Category[];
  initial?: Camera | null;
  onClose: () => void;
  onSaved: () => void;
};

const PTZ_OPTIONS: { value: PtzType; label: string }[] = [
  { value: "none", label: "Bez PTZ" },
  { value: "dahua", label: "Dahua / Uniarch CGI" },
  { value: "hikvision", label: "Hikvision ISAPI" },
  { value: "onvif", label: "ONVIF" },
];

export function CameraModal({
  open,
  categories,
  initial,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ptzType, setPtzType] = useState<PtzType>("none");
  const [ptzHost, setPtzHost] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || "");
    setRtspUrl(
      initial?.rtspUrl || "rtsp://admin:haslo@192.168.103.84"
    );
    setCategoryId(initial?.categoryId || "");
    setPtzType(initial?.ptzType || "none");
    setPtzHost(initial?.ptzHost || "");
    setEnabled(initial?.enabled ?? true);
    setError("");
  }, [open, initial]);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name,
      rtspUrl,
      categoryId: categoryId || null,
      ptzType,
      ptzHost: ptzHost || undefined,
      enabled,
    };

    try {
      const res = await fetch(
        initial ? `/api/cameras/${initial.id}` : "/api/cameras",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nie udało się zapisać");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/40 p-4 backdrop-blur-sm sm:items-center">
      <div className="panel w-full max-w-lg animate-fade-up p-6">
        <h2 className="font-display text-xl font-semibold text-ink-950">
          {initial ? "Edytuj kamerę" : "Dodaj kamerę"}
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Podaj adres RTSP (jak w VLC). Stream będzie konwertowany do przeglądarki
          przez go2rtc.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div>
            <label className="label">Nazwa</label>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wejście główne"
              required
            />
          </div>

          <div>
            <label className="label">URL RTSP</label>
            <input
              className="field font-mono text-xs"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              placeholder="rtsp://admin:haslo@192.168.103.84"
              required
            />
          </div>

          <div>
            <label className="label">Kategoria</label>
            <select
              className="field"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Bez kategorii</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Sterowanie PTZ</label>
            <select
              className="field"
              value={ptzType}
              onChange={(e) => setPtzType(e.target.value as PtzType)}
            >
              {PTZ_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {ptzType !== "none" && (
            <div>
              <label className="label">Host PTZ (opcjonalnie)</label>
              <input
                className="field"
                value={ptzHost}
                onChange={(e) => setPtzHost(e.target.value)}
                placeholder="Domyślnie IP z URL RTSP"
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-signal focus:ring-signal"
            />
            Kamera aktywna (stream włączony)
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Zapisywanie…" : "Zapisz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
