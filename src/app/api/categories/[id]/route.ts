import { NextRequest, NextResponse } from "next/server";
import { deleteCategory, updateCategory } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const updated = await updateCategory(params.id, {
    name: body.name !== undefined ? String(body.name) : undefined,
    color: body.color !== undefined ? String(body.color) : undefined,
  });
  if (!updated) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ok = await deleteCategory(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
