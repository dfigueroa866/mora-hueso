import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/orders/by-tracking?t=MH-123456
 * Devuelve datos mínimos del pedido para la página de confirmación.
 */
export async function GET(req: NextRequest) {
  const tracking = new URL(req.url).searchParams.get("t")?.trim();
  if (!tracking) {
    return NextResponse.json(
      { error: "Falta el número de seguimiento" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findFirst({
    where: { trackingNumber: tracking },
    include: {
      items: {
        select: { name: true, quantity: true, price: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      trackingNumber: order.trackingNumber,
      status: order.status,
      total: order.total,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingCost: order.shippingCost,
      shippingMethod: order.shippingMethod,
      paymentProvider: order.paymentProvider,
      billingEmail: order.billingEmail,
      emailSentTo: order.billingEmail,
      items: order.items,
      createdAt: order.createdAt,
    },
  });
}
