import { promises as fs } from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import type { Camera, Category, Store } from "./types";

const DEFAULT_STORE: Store = {
  categories: [
    {
      id: "default",
      name: "Ogólne",
      color: "#0d9488",
      createdAt: new Date().toISOString(),
    },
  ],
  cameras: [],
};

function dataPath() {
  const dir = process.env.DATA_DIR || "./data";
  return path.resolve(dir, "store.json");
}

async function ensureStore(): Promise<Store> {
  const file = dataPath();
  const dir = path.dirname(file);
  await fs.mkdir(dir, { recursive: true });
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as Store;
  } catch {
    await fs.writeFile(file, JSON.stringify(DEFAULT_STORE, null, 2));
    return structuredClone(DEFAULT_STORE);
  }
}

async function writeStore(store: Store) {
  const file = dataPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(store, null, 2));
}

export async function getStore(): Promise<Store> {
  return ensureStore();
}

export async function listCategories(): Promise<Category[]> {
  const store = await ensureStore();
  return store.categories;
}

export async function createCategory(input: {
  name: string;
  color?: string;
}): Promise<Category> {
  const store = await ensureStore();
  const category: Category = {
    id: uuid(),
    name: input.name.trim(),
    color: input.color || "#0d9488",
    createdAt: new Date().toISOString(),
  };
  store.categories.push(category);
  await writeStore(store);
  return category;
}

export async function updateCategory(
  id: string,
  input: Partial<Pick<Category, "name" | "color">>
): Promise<Category | null> {
  const store = await ensureStore();
  const idx = store.categories.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  store.categories[idx] = {
    ...store.categories[idx],
    ...input,
    name: input.name?.trim() ?? store.categories[idx].name,
  };
  await writeStore(store);
  return store.categories[idx];
}

export async function deleteCategory(id: string): Promise<boolean> {
  const store = await ensureStore();
  const before = store.categories.length;
  store.categories = store.categories.filter((c) => c.id !== id);
  store.cameras = store.cameras.map((cam) =>
    cam.categoryId === id ? { ...cam, categoryId: null } : cam
  );
  if (store.categories.length === before) return false;
  await writeStore(store);
  return true;
}

export async function listCameras(): Promise<Camera[]> {
  const store = await ensureStore();
  return store.cameras;
}

export async function getCamera(id: string): Promise<Camera | null> {
  const store = await ensureStore();
  return store.cameras.find((c) => c.id === id) ?? null;
}

export async function createCamera(
  input: Omit<Camera, "id" | "createdAt" | "updatedAt">
): Promise<Camera> {
  const store = await ensureStore();
  const now = new Date().toISOString();
  const camera: Camera = {
    ...input,
    id: uuid(),
    name: input.name.trim(),
    rtspUrl: input.rtspUrl.trim(),
    createdAt: now,
    updatedAt: now,
  };
  store.cameras.push(camera);
  await writeStore(store);
  return camera;
}

export async function updateCamera(
  id: string,
  input: Partial<Omit<Camera, "id" | "createdAt">>
): Promise<Camera | null> {
  const store = await ensureStore();
  const idx = store.cameras.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  store.cameras[idx] = {
    ...store.cameras[idx],
    ...input,
    name: input.name?.trim() ?? store.cameras[idx].name,
    rtspUrl: input.rtspUrl?.trim() ?? store.cameras[idx].rtspUrl,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
  return store.cameras[idx];
}

export async function deleteCamera(id: string): Promise<boolean> {
  const store = await ensureStore();
  const before = store.cameras.length;
  store.cameras = store.cameras.filter((c) => c.id !== id);
  if (store.cameras.length === before) return false;
  await writeStore(store);
  return true;
}
