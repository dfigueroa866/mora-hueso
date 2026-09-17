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
  const validator = new WebhookSignatureValidator();
  validator.validate({
    xSignature: headerValue(req.headers.get("x-signature")),
    xRequestId: headerValue(req.headers.get("x-request-id")),
    dataId,
    secret,
    toleranceSeconds: 300,
  });
  return true;
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
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const type =
      body.type ||
      body.topic ||
      url.searchParams.get("type") ||
      url.searchParams.get("topic");
    const dataId = String(
      body?.data?.id ||
        body?.id ||
        url.searchParams.get("data.id") ||
        url.searchParams.get("id") ||
        ""
    );

    if ((type === "payment" || type === "topic_payment") && dataId) {
      signatureOk(req, dataId);
      await handlePaymentNotification(dataId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("MP webhook error", err);
    const name = err instanceof Error ? err.name : "";
    if (name === "InvalidWebhookSignatureError") {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic") || url.searchParams.get("type");
  const id = url.searchParams.get("id") || url.searchParams.get("data.id");
  try {
    if ((topic === "payment" || topic === "topic_payment") && id) {
      signatureOk(req, id);
      await handlePaymentNotification(id);
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
