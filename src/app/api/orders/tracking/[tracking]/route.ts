import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { orderStatusLabel } from "@/lib/orders";

export async function GET(
  _req: NextRequest,
  { params }: { params: { tracking: string } }
) {
  const order = await prisma.order.findFirst({
    where: { trackingNumber: params.tracking },
    include: { items: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      trackingNumber: order.trackingNumber,
      status: order.status,
      statusLabel: orderStatusLabel(order.status),
      total: order.total,
      subtotal: order.subtotal,
      tax: order.tax,
      shippingCost: order.shippingCost,
      shippingMethod: order.shippingMethod,
      billingEmail: order.billingEmail,
      paymentProvider: order.paymentProvider,
      mpPaymentId: order.mpPaymentId,
      paidAt: order.paidAt,
      items: order.items,
    },
  });
}
