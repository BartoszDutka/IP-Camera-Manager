"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Camera, Category } from "@/lib/types";
import { CameraModal } from "@/components/CameraModal";
import { CameraPlayer } from "@/components/CameraPlayer";
import { CategoryPanel } from "@/components/CategoryPanel";
import { IconCamera, IconLogout, IconPlus } from "@/components/icons";

export default function DashboardPage() {
  const router = useRouter();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Camera | null>(null);
  const [username, setUsername] = useState("");

  const load = useCallback(async () => {
    const [camRes, catRes, meRes] = await Promise.all([
      fetch("/api/cameras"),
      fetch("/api/categories"),
      fetch("/api/auth/me"),
    ]);

    if (meRes.status === 401) {
      router.replace("/login");
      return;
    }

    const [cams, cats, me] = await Promise.all([
      camRes.json(),
      catRes.json(),
      meRes.json(),
    ]);

    setCameras(cams);
    setCategories(cats);
    setUsername(me.username || "");
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (selectedCategory === "all") return cameras;
    return cameras.filter((c) => c.categoryId === selectedCategory);
  }, [cameras, selectedCategory]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  async function removeCamera(cam: Camera) {
    if (!confirm(`Usunąć kamerę „${cam.name}”?`)) return;
    await fetch(`/api/cameras/${cam.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-signal-light">
              <IconCamera className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-ink-950">
                CamManager
              </p>
              <p className="text-xs text-ink-500">
                {username ? `Zalogowano: ${username}` : "Podgląd kamer"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <IconPlus />
              <span className="hidden sm:inline">Dodaj kamerę</span>
            </button>
            <button type="button" className="btn-ghost" onClick={logout} title="Wyloguj">
              <IconLogout />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_1fr]">
        <CategoryPanel
          categories={categories}
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          onChanged={load}
        />

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-950">
                {selectedCategory === "all"
                  ? "Wszystkie kamery"
                  : categories.find((c) => c.id === selectedCategory)?.name ||
                    "Kamery"}
              </h1>
              <p className="text-sm text-ink-500">
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "kamera"
                  : filtered.length < 5
                    ? "kamery"
                    : "kamer"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="panel p-10 text-center text-ink-500">Ładowanie…</div>
          ) : filtered.length === 0 ? (
            <div className="panel flex flex-col items-center gap-4 p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
                <IconCamera className="h-7 w-7" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-ink-900">
                  Brak kamer w tym widoku
                </p>
                <p className="mt-1 max-w-sm text-sm text-ink-500">
                  Dodaj kamerę z adresem RTSP — takim samym jak w VLC — i
                  przypisz ją do kategorii.
                </p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <IconPlus />
                Dodaj pierwszą kamerę
              </button>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {filtered.map((cam, i) => (
                <div
                  key={cam.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="animate-fade-up"
                >
                  <CameraPlayer
                    camera={cam}
                    onEdit={() => {
                      setEditing(cam);
                      setModalOpen(true);
                    }}
                    onDelete={() => removeCamera(cam)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <CameraModal
        open={modalOpen}
        categories={categories}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={load}
      />
    </div>
  );
}
