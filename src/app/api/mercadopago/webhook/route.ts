import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getPaymentById,
  hasMercadoPagoToken,
  mapMpStatusToOrderStatus,
} from "@/lib/mercadopago";
import { markOrderCancelled, markOrderPaid } from "@/lib/orders";

async function handlePaymentNotification(paymentId: string) {
  if (!hasMercadoPagoToken()) return;
  const payment = await getPaymentById(paymentId);
  const orderId = payment.external_reference;
  if (!orderId) return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  const next = mapMpStatusToOrderStatus(payment.status);
  if (next === "paid") {
    await markOrderPaid({
      orderId,
      mpPaymentId: String(payment.id || paymentId),
    });
  } else if (next === "cancelled") {
    await markOrderCancelled(orderId);
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "pending_payment",
        mpPaymentId: String(payment.id || paymentId),
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const type =
      body.type ||
      body.topic ||
      url.searchParams.get("type") ||
      url.searchParams.get("topic");
    const dataId =
      body?.data?.id ||
      body?.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id");

    if ((type === "payment" || type === "topic_payment") && dataId) {
      await handlePaymentNotification(String(dataId));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("MP webhook error", err);
    // Always ACK to avoid retry storms while logging the issue
    return NextResponse.json({ ok: true });
  }
}

export async function GET(req: NextRequest) {
  // IPN-style query notifications
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") || url.searchParams.get("type");
  const id = url.searchParams.get("id") || url.searchParams.get("data.id");
  try {
    if ((topic === "payment" || topic === "topic_payment") && id) {
      await handlePaymentNotification(id);
    }
  } catch (err) {
    console.error("MP IPN error", err);
  }
  return NextResponse.json({ ok: true });
}
