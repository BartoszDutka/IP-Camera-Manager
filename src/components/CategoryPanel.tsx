"use client";

import { FormEvent, useState } from "react";
import type { Category } from "@/lib/types";
import { IconPlus, IconTrash } from "./icons";

type Props = {
  categories: Category[];
  selectedId: string | "all";
  onSelect: (id: string | "all") => void;
  onChanged: () => void;
};

const COLORS = ["#0d9488", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

export function CategoryPanel({
  categories,
  selectedId,
  onSelect,
  onChanged,
}: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [open, setOpen] = useState(false);

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    setName("");
    setOpen(false);
    onChanged();
  }

  async function remove(id: string) {
    if (!confirm("Usunąć kategorię? Kamery zostaną bez kategorii.")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (selectedId === id) onSelect("all");
    onChanged();
  }

  return (
    <aside className="panel animate-slide-in p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-500">
          Kategorie
        </h2>
        <button
          type="button"
          className="btn-ghost !px-2 !py-1.5"
          onClick={() => setOpen((v) => !v)}
          title="Dodaj kategorię"
        >
          <IconPlus />
        </button>
      </div>

      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
            selectedId === "all"
              ? "bg-signal/10 font-semibold text-signal-dark"
              : "text-ink-700 hover:bg-ink-50"
          }`}
        >
          Wszystkie kamery
        </button>

        {categories.map((c) => (
          <div key={c.id} className="group flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                selectedId === c.id
                  ? "bg-signal/10 font-semibold text-signal-dark"
                  : "text-ink-700 hover:bg-ink-50"
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: c.color }}
              />
              <span className="truncate">{c.name}</span>
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-ink-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              onClick={() => remove(c.id)}
              title="Usuń"
            >
              <IconTrash className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {open && (
        <form onSubmit={addCategory} className="mt-4 space-y-2 border-t border-ink-100 pt-4">
          <input
            className="field"
            placeholder="Nazwa kategorii"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full ring-2 ring-offset-2 ${
                  color === c ? "ring-ink-800" : "ring-transparent"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
          <button type="submit" className="btn-primary w-full">
            Dodaj kategorię
          </button>
        </form>
      )}
    </aside>
  );
}
