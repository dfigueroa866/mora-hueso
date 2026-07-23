import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { productSchema } from "@/lib/validators";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = productSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await prisma.product.update({
    where: { id: params.id },
    data: { active: false },
  });
  return NextResponse.json({ ok: true });
}
