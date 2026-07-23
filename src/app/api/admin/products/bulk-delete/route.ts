import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Selecciona al menos un producto"),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "IDs inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: parsed.data.ids }, active: true },
    data: { active: false },
  });

  return NextResponse.json({
    ok: true,
    deleted: result.count,
  });
}
