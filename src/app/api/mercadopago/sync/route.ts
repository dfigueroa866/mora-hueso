import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getPaymentById,
  hasMercadoPagoToken,
  mapMpStatusToOrderStatus,
} from "@/lib/mercadopago";
import { markOrderCancelled, markOrderPaid } from "@/lib/orders";

/** Sync order status after returning from Mercado Pago / demo checkout. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const trackingNumber = String(body.trackingNumber || "");
  const paymentId = body.paymentId ? String(body.paymentId) : null;
  const demoStatus = body.demoStatus ? String(body.demoStatus) : null;

  if (!trackingNumber) {
    return NextResponse.json({ error: "Falta tracking" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { trackingNumber },
    include: { items: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  // Demo approval/rejection
  if (order.paymentProvider === "demo" && demoStatus) {
    if (demoStatus === "approved") {
      const updated = await markOrderPaid({ orderId: order.id });
      return NextResponse.json({ order: updated });
    }
    if (demoStatus === "rejected") {
      const updated = await markOrderCancelled(order.id);
      return NextResponse.json({ order: updated });
    }
  }

  // Mercado Pago: fetch payment if we have token + payment id
  if (hasMercadoPagoToken() && paymentId) {
    try {
      const payment = await getPaymentById(paymentId);
      const next = mapMpStatusToOrderStatus(payment.status);
      if (next === "paid") {
        const updated = await markOrderPaid({
          orderId: order.id,
          mpPaymentId: String(payment.id || paymentId),
        });
        return NextResponse.json({ order: updated });
      }
      if (next === "cancelled") {
        const updated = await markOrderCancelled(order.id);
        return NextResponse.json({ order: updated });
      }
    } catch (err) {
      console.error("sync payment failed", err);
    }
  }

  // Fallback: query params status from MP redirect
  const statusHint = body.status ? String(body.status) : null;
  if (statusHint === "approved") {
    const updated = await markOrderPaid({
      orderId: order.id,
      mpPaymentId: paymentId,
    });
    return NextResponse.json({ order: updated });
  }
  if (statusHint === "rejected" || statusHint === "failure") {
    const updated = await markOrderCancelled(order.id);
    return NextResponse.json({ order: updated });
  }

  return NextResponse.json({ order });
}
