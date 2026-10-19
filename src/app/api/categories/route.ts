import { NextRequest, NextResponse } from "next/server";
import { createCategory, listCategories } from "@/lib/db";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nazwa jest wymagana" }, { status: 400 });
  }
  const category = await createCategory({
    name,
    color: body.color ? String(body.color) : undefined,
  });
  return NextResponse.json(category, { status: 201 });
}
