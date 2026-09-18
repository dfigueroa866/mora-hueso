import { NextRequest, NextResponse } from "next/server";
import { WebhookSignatureValidator } from "mercadopago";
import { getPaymentById, hasMercadoPagoToken } from "@/lib/mercadopago";
import { applyMercadoPagoStatus } from "@/lib/orders";

function headerValue(value: string | null) {
  return value || undefined;
}

/** data.id alfanumérico debe ir en minúsculas para la firma HMAC. */
function normalizeDataId(raw: string) {
  const id = raw.trim();
  if (!id) return id;
  if (/^[0-9]+$/.test(id)) return id;
  return id.toLowerCase();
}

function webhookSecret() {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || "";
  // Antes se pegó la URL del endpoint por error; eso provoca 401 en todos los avisos.
  if (/^https?:\/\//i.test(secret)) {
    console.error(
      "MERCADOPAGO_WEBHOOK_SECRET parece una URL. Usa la clave secreta del panel de Webhooks."
    );
    return "";
  }
  return secret;
}

function assertSignature(req: NextRequest, dataId: string) {
  const secret = webhookSecret();
  if (!secret) return;
  const xSignature = headerValue(req.headers.get("x-signature"));
  if (!xSignature) {
    console.warn("Webhook sin x-signature; se procesa con Access Token");
    return;
  }
  WebhookSignatureValidator.validate({
    xSignature,
    xRequestId: headerValue(req.headers.get("x-request-id")),
    dataId: normalizeDataId(dataId),
    secret,
    toleranceSeconds: 3600,
  });
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
  if (!orderId) {
    console.warn("Webhook payment sin external_reference", paymentId);
    return;
  }
  await applyMercadoPagoStatus(orderId, {
    id: payment.id || paymentId,
    status: payment.status,
    status_detail: payment.status_detail,
    payment_method_id: payment.payment_method_id,
    payment_type_id: payment.payment_type_id,
    order: payment.order,
  });
}

async function processPaymentEvent(req: NextRequest, dataId: string) {
  try {
    assertSignature(req, dataId);
  } catch (err) {
    console.error(
      "Firma inválida. Revisa MERCADOPAGO_WEBHOOK_SECRET (clave del panel, no la URL).",
      err
    );
    // Seguimos: el cobro se confirma con el Access Token al consultar la API.
  }
  await handlePaymentNotification(dataId);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const { type, dataId } = notificationParts(req, body);

    if ((type === "payment" || type === "topic_payment") && dataId) {
      await processPaymentEvent(req, dataId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("MP webhook error", err);
    // ACK para que Mercado Pago no reintente en bucle por errores temporales.
    return NextResponse.json({ ok: true });
  }
}

export async function GET(req: NextRequest) {
  const { type, dataId } = notificationParts(req, {});
  try {
    if ((type === "payment" || type === "topic_payment") && dataId) {
      await processPaymentEvent(req, dataId);
    }
  } catch (err) {
    console.error("MP IPN error", err);
  }
  return NextResponse.json({ ok: true });
}
