import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOrderStatus } from "@/lib/constants";
import { canUpdateOrderStatus } from "@/lib/orders";

const updateSchema = z.object({
  status: z.string().optional(),
  trackingNumber: z.string().min(3).max(40).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const data: { status?: string; trackingNumber?: string } = {};

  if (parsed.data.trackingNumber) {
    data.trackingNumber = parsed.data.trackingNumber.trim();
  }

  if (parsed.data.status) {
    if (!isOrderStatus(parsed.data.status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    if (!canUpdateOrderStatus(order.status, parsed.data.status)) {
      return NextResponse.json(
        {
          error: `No se puede pasar de ${order.status} a ${parsed.data.status}`,
        },
        { status: 400 }
      );
    }
    data.status = parsed.data.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data,
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ order: updated });
}
