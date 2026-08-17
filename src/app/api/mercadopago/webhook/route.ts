import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getMercadoPagoPayment,
  getMercadoPagoWebhookSecret,
  mapPaymentStatusToOrderStatus,
  paymentAmountMatchesOrder,
  verifyMercadoPagoSignature,
} from "@/lib/mercadopago";
import {
  restoreStockAndCancel,
  shouldRestoreStockOnStatusChange,
} from "@/lib/orders";
import { isFinalOrderStatus } from "@/lib/constants";

/**
 * POST /api/mercadopago/webhook
 * Recibe notificaciones de Mercado Pago y actualiza el estado del pedido.
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
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");
    const dataIdFromQuery =
      url.searchParams.get("data.id") || url.searchParams.get("id");

    let topic =
      url.searchParams.get("topic") || url.searchParams.get("type") || "";
    let resourceId = dataIdFromQuery || "";
    let rawBody: unknown = null;

    try {
      rawBody = await req.json();
      const body = rawBody as Record<string, unknown>;
      if (body?.type) topic = String(body.type);
      if (body?.topic) topic = String(body.topic);
      const data = body?.data as { id?: string } | undefined;
      if (data?.id) resourceId = String(data.id);
      if (body?.id && !resourceId) resourceId = String(body.id);
      if (body?.resource && !resourceId) {
        const parts = String(body.resource).split("/");
        resourceId = parts[parts.length - 1];
      }
    } catch {
      // Algunos webhooks solo traen query params
    }

    const secret = getMercadoPagoWebhookSecret();
    if (secret) {
      const valid = verifyMercadoPagoSignature({
        xSignature,
        xRequestId,
        dataId: resourceId || dataIdFromQuery,
        secret,
      });
      if (!valid) {
        console.warn("[Mercado Pago] firma de webhook inválida");
        return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error(
        "[Mercado Pago] Falta MERCADOPAGO_WEBHOOK_SECRET en producción"
      );
      return NextResponse.json(
        { error: "Webhook no configurado" },
        { status: 503 }
      );
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

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Mercado Pago] webhook error:", e);
    return NextResponse.json({ ok: true, warning: "procesado con error" });
  }
}

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

  // Idempotencia: mismo pago ya aplicado
  if (order.mpPaymentId && order.mpPaymentId === String(payment.id)) {
    if (isFinalOrderStatus(order.status) && order.status !== "pending_payment") {
      return;
    }
  }

  if (!paymentAmountMatchesOrder(order.total, payment.transaction_amount)) {
    console.warn(
      `[Mercado Pago] monto no coincide: order=${order.total} payment=${payment.transaction_amount}`
    );
    return;
  }

  const nextStatus = mapPaymentStatusToOrderStatus(payment.status);

  if (
    isFinalOrderStatus(order.status) &&
    order.status !== "pending_payment" &&
    order.status === nextStatus
  ) {
    await prisma.order.update({
      where: { id: order.id },
      data: { mpPaymentId: String(payment.id) },
    });
    return;
  }

  // No degradar un pedido ya confirmado/enviado con notificaciones tardías
  if (
    (order.status === "confirmed" || order.status === "shipped") &&
    nextStatus !== order.status &&
    nextStatus !== "refunded"
  ) {
    await prisma.order.update({
      where: { id: order.id },
      data: { mpPaymentId: String(payment.id) },
    });
    return;
  }

  if (shouldRestoreStockOnStatusChange(order.status, nextStatus)) {
    const finalStatus =
      nextStatus === "refunded" ? "refunded" : "cancelled";
    await restoreStockAndCancel(order.id, finalStatus);
    await prisma.order.update({
      where: { id: order.id },
      data: { mpPaymentId: String(payment.id) },
    });
    console.log(
      `[Mercado Pago] Pedido ${order.trackingNumber} → ${finalStatus} (pago ${payment.id})`
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
