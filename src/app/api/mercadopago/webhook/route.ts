import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getMercadoPagoPayment,
  mapPaymentStatusToOrderStatus,
} from "@/lib/mercadopago";

/**
 * POST /api/mercadopago/webhook
 * Recibe notificaciones de Mercado Pago (topic payment / merchant_order)
 * y actualiza el estado del pedido.
 *
 * Mercado Pago puede enviar el id por query (?id=&topic=) o en el body JSON.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: "Mercado Pago no configurado" },
        { status: 503 }
      );
    }

    const url = new URL(req.url);
    let topic =
      url.searchParams.get("topic") ||
      url.searchParams.get("type") ||
      "";
    let resourceId =
      url.searchParams.get("id") ||
      url.searchParams.get("data.id") ||
      "";

    try {
      const body = await req.json();
      if (body?.type) topic = String(body.type);
      if (body?.topic) topic = String(body.topic);
      if (body?.data?.id) resourceId = String(body.data.id);
      if (body?.id && !resourceId) resourceId = String(body.id);
      if (body?.resource && !resourceId) {
        const parts = String(body.resource).split("/");
        resourceId = parts[parts.length - 1];
      }
    } catch {
      // Algunos webhooks solo traen query params
    }

    if (!resourceId) {
      return NextResponse.json({ ok: true, skipped: "sin id" });
    }

    const normalizedTopic = topic.toLowerCase();

    if (
      normalizedTopic === "payment" ||
      normalizedTopic.includes("payment") ||
      !normalizedTopic
    ) {
      await handlePaymentNotification(resourceId);
    }

    // Siempre 200 para que MP no reintente en bucle por errores de negocio
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Mercado Pago] webhook error:", e);
    return NextResponse.json({ ok: true, warning: "procesado con error" });
  }
}

/** Mercado Pago también hace GET de verificación en algunos entornos. */
export async function GET(req: NextRequest) {
  return POST(req);
}

async function handlePaymentNotification(paymentId: string) {
  const payment = await getMercadoPagoPayment(paymentId);
  const orderId = payment.external_reference;
  if (!orderId) {
    console.warn("[Mercado Pago] pago sin external_reference:", paymentId);
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    console.warn("[Mercado Pago] pedido no encontrado:", orderId);
    return;
  }

  const nextStatus = mapPaymentStatusToOrderStatus(payment.status);
  const alreadyFinal =
    order.status === "confirmed" ||
    order.status === "cancelled" ||
    order.status === "refunded";

  // Evitar doble restauración de stock si ya se canceló
  if (alreadyFinal && order.status === nextStatus) {
    await prisma.order.update({
      where: { id: order.id },
      data: { mpPaymentId: String(payment.id) },
    });
    return;
  }

  if (
    order.status === "pending_payment" &&
    (nextStatus === "cancelled" || nextStatus === "refunded")
  ) {
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          mpPaymentId: String(payment.id),
        },
      });
    });
    console.log(
      `[Mercado Pago] Pedido ${order.trackingNumber} → ${nextStatus} (pago ${payment.id})`
    );
    return;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: nextStatus,
      mpPaymentId: String(payment.id),
    },
  });

  if (nextStatus === "confirmed") {
    console.log(
      `[Mercado Pago] Pedido ${order.trackingNumber} confirmado → ${order.billingEmail}`
    );
  }
}
