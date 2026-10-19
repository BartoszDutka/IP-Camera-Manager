"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Błąd logowania");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Nie udało się połączyć z serwerem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-signal/15 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-warn/15 blur-3xl" />
      </div>

      <div className="panel relative w-full max-w-md animate-fade-up p-8 sm:p-10">
        <div className="mb-8">
          <p className="font-display text-3xl font-bold tracking-tight text-ink-950">
            CamManager
          </p>
          <p className="mt-2 text-sm text-ink-500">
            Zaloguj się, aby zarządzać kamerami i podglądem na żywo.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="username">
              Login
            </label>
            <input
              id="username"
              className="field"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Hasło
            </label>
            <input
              id="password"
              type="password"
              className="field"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Logowanie…" : "Zaloguj"}
          </button>
        </form>
      </div>
    </main>
  );
}
