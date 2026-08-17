import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const dogSize = searchParams.get("dogSize");
  const ingredient = searchParams.get("ingredient");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const q = searchParams.get("q");
  const admin = searchParams.get("admin") === "1";

  if (admin) {
    const { requireAdmin } = await import("@/lib/auth");
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const where: Record<string, unknown> = {};
  if (!admin) where.active = true;
  if (category) where.category = category;
  if (dogSize && dogSize !== "todos") {
    where.OR = [{ dogSize }, { dogSize: "todos" }];
  }
  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: Number(minPrice) } : {}),
      ...(maxPrice ? { lte: Number(maxPrice) } : {}),
    };
  }
  if (ingredient) {
    where.ingredients = { contains: ingredient };
  }
  if (q) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { ingredients: { contains: q } },
        ],
      },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const { requireAdmin } = await import("@/lib/auth");
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { productSchema } = await import("@/lib/validators");
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.create({ data: parsed.data });
    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear. ¿SKU duplicado?" },
      { status: 400 }
    );
  }
}
