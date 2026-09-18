import { NextRequest, NextResponse } from "next/server";
import { WebhookSignatureValidator } from "mercadopago";
import { getPaymentById, hasMercadoPagoToken } from "@/lib/mercadopago";
import { applyMercadoPagoStatus } from "@/lib/orders";

function headerValue(value: string | null) {
  return value || undefined;
}

function signatureOk(req: NextRequest, dataId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  WebhookSignatureValidator.validate({
    xSignature: headerValue(req.headers.get("x-signature")),
    xRequestId: headerValue(req.headers.get("x-request-id")),
    dataId,
    secret,
    toleranceSeconds: 300,
  });
  return true;
}

function notificationParts(req: NextRequest, body: Record<string, unknown>) {
  const url = new URL(req.url);
  const type = String(
    body.type ||
      body.topic ||
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      ""
  );
  const data = body.data as { id?: string | number } | undefined;
  const dataId = String(
    data?.id ||
      body.id ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      ""
  );
  return { type, dataId };
}

async function handlePaymentNotification(paymentId: string) {
  if (!hasMercadoPagoToken()) return;
  const payment = await getPaymentById(paymentId);
  const orderId = payment.external_reference;
  if (!orderId) return;
  await applyMercadoPagoStatus(orderId, {
    id: payment.id || paymentId,
    status: payment.status,
    status_detail: payment.status_detail,
    payment_method_id: payment.payment_method_id,
    payment_type_id: payment.payment_type_id,
    order: payment.order,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const { type, dataId } = notificationParts(req, body);

    if ((type === "payment" || type === "topic_payment") && dataId) {
      signatureOk(req, dataId);
      await handlePaymentNotification(dataId);
    }

    // merchant_order: Mercado Pago exige ACK 200; el estado del pedido
    // se confirma con la notificación payment o con /api/mercadopago/sync.
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("MP webhook error", err);
    const name = err instanceof Error ? err.name : "";
    if (name === "InvalidWebhookSignatureError") {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }
    // ACK para que Mercado Pago no reintente en bucle por errores temporales.
    return NextResponse.json({ ok: true });
  }
}

export async function GET(req: NextRequest) {
  const { type, dataId } = notificationParts(req, {});
  try {
    if ((type === "payment" || type === "topic_payment") && dataId) {
      signatureOk(req, dataId);
      await handlePaymentNotification(dataId);
    }
  } catch (err) {
    console.error("MP IPN error", err);
    const name = err instanceof Error ? err.name : "";
    if (name === "InvalidWebhookSignatureError") {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }
  }
  return NextResponse.json({ ok: true });
}
