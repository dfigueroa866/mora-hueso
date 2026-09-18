import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  findLatestPaymentForOrder,
  getPaymentById,
  hasMercadoPagoToken,
} from "@/lib/mercadopago";
import {
  applyMercadoPagoStatus,
  markOrderCancelled,
  markOrderPaid,
} from "@/lib/orders";

/** Sync order status after returning from Mercado Pago / demo checkout. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const trackingNumber = String(body.trackingNumber || "");
  const paymentId = body.paymentId ? String(body.paymentId) : null;
  const merchantOrderId = body.merchantOrderId
    ? String(body.merchantOrderId)
    : null;
  const paymentType = body.paymentType ? String(body.paymentType) : null;
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

  if (hasMercadoPagoToken()) {
    try {
      const payment = paymentId
        ? await getPaymentById(paymentId)
        : await findLatestPaymentForOrder(order.id);
      if (payment?.status) {
        const mpOrder =
          "order" in payment ? payment.order : undefined;
        const updated = await applyMercadoPagoStatus(order.id, {
          id: payment.id || paymentId,
          status: payment.status,
          status_detail: payment.status_detail,
          payment_method_id: payment.payment_method_id,
          payment_type_id: payment.payment_type_id || paymentType,
          order: mpOrder,
          merchantOrderId,
        });
        if (updated && updated.status !== "pending_payment") {
          return NextResponse.json({ order: updated });
        }
      }
    } catch (err) {
      console.error("sync payment failed", err);
    }
  }

  // Nunca marcar pagado solo por el query: hay que confirmar el estado en la API.
  const statusHint = body.status ? String(body.status) : null;
  if (paymentId && hasMercadoPagoToken()) {
    try {
      const payment = await getPaymentById(paymentId);
      if (payment?.status) {
        const updated = await applyMercadoPagoStatus(order.id, {
          id: payment.id || paymentId,
          status: payment.status,
          status_detail: payment.status_detail,
          payment_method_id: payment.payment_method_id,
          payment_type_id: payment.payment_type_id || paymentType,
          order: payment.order,
          merchantOrderId,
        });
        return NextResponse.json({ order: updated });
      }
    } catch (err) {
      console.error("sync payment fallback failed", err);
    }
  }
  if (statusHint === "rejected" || statusHint === "failure") {
    const updated = await markOrderCancelled(order.id);
    return NextResponse.json({ order: updated });
  }

  return NextResponse.json({ order });
}
