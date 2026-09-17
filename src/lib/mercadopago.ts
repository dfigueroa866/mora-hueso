import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { roundMoney } from "@/lib/constants";

export function hasMercadoPagoToken() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
}

export function allowDemoPayments() {
  return process.env.ALLOW_DEMO_PAYMENTS !== "false";
}

export function getMercadoPagoClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN");
  }
  return new MercadoPagoConfig({ accessToken });
}

export function getAppBaseUrl(reqUrl?: string) {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (reqUrl) {
    try {
      const u = new URL(reqUrl);
      return `${u.protocol}//${u.host}`;
    } catch {
      /* ignore */
    }
  }
  return "http://localhost:3000";
}

function mpItemId(value: string, index: number) {
  const clean = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return clean || `item-${index + 1}`;
}

export function publicNotificationUrl(baseUrl: string) {
  if (!baseUrl.startsWith("https://")) return null;
  if (/localhost|127\.0\.0\.1/i.test(baseUrl)) return null;
  return `${baseUrl}/api/mercadopago/webhook`;
}

function backUrl(baseUrl: string, status: string, tracking: string) {
  const url = new URL("/confirmacion", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  url.searchParams.set("status", status);
  url.searchParams.set("t", tracking);
  return url.toString();
}

export async function createCheckoutPreference(input: {
  orderId: string;
  trackingNumber: string;
  total: number;
  items: {
    id?: string;
    title: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }[];
  payerEmail: string;
  payerName: string;
  payerZip?: string;
  payerStreet?: string;
  baseUrl: string;
}) {
  const client = getMercadoPagoClient();
  const preference = new Preference(client);
  const isLocal =
    input.baseUrl.includes("localhost") || input.baseUrl.includes("127.0.0.1");
  const notificationUrl = publicNotificationUrl(input.baseUrl);
  const [firstName, ...rest] = input.payerName.trim().split(/\s+/);
  const usedIds = new Set<string>();

  const result = await preference.create({
    body: {
      items: input.items.map((item, index) => {
        let id = mpItemId(item.id || item.title, index);
        while (usedIds.has(id)) id = `${id}-${index + 1}`.slice(0, 40);
        usedIds.add(id);
        return {
          id,
          title: item.title.slice(0, 256),
          description: (item.description || item.title).slice(0, 256),
          quantity: Math.max(1, Math.round(item.quantity)),
          unit_price: Number(roundMoney(item.unitPrice).toFixed(2)),
          currency_id: "MXN",
        };
      }),
      payer: {
        email: input.payerEmail,
        name: firstName || "Cliente",
        surname: rest.join(" ") || "Mora",
        ...(input.payerZip || input.payerStreet
          ? {
              address: {
                zip_code: input.payerZip || undefined,
                street_name: input.payerStreet || undefined,
              },
            }
          : {}),
      },
      external_reference: input.orderId,
      statement_descriptor: "MORAYHUESO",
      back_urls: {
        success: backUrl(input.baseUrl, "approved", input.trackingNumber),
        failure: backUrl(input.baseUrl, "rejected", input.trackingNumber),
        pending: backUrl(input.baseUrl, "pending", input.trackingNumber),
      },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      ...(isLocal || !notificationUrl
        ? {}
        : { auto_return: "approved" as const }),
      metadata: {
        tracking_number: input.trackingNumber,
      },
    },
  });

  const initPoint = result.init_point;
  if (!initPoint) {
    throw new Error("Mercado Pago no devolvió init_point");
  }

  return {
    preferenceId: result.id || "",
    initPoint,
  };
}

export async function getPaymentById(paymentId: string) {
  const client = getMercadoPagoClient();
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

/** El webhook no llega a localhost. Busca el cobro por el id del pedido. */
export async function findLatestPaymentForOrder(orderId: string) {
  if (!hasMercadoPagoToken()) return null;
  const payment = new Payment(getMercadoPagoClient());
  const found = await payment.search({
    options: {
      external_reference: orderId,
      sort: "date_created",
      criteria: "desc",
    },
  });
  const results = found.results || [];
  return results.find((item) => item.status === "approved") || results[0] || null;
}

export function mapMpStatusToOrderStatus(
  mpStatus?: string | null
): "paid" | "pending_payment" | "cancelled" {
  switch (mpStatus) {
    case "approved":
      return "paid";
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "cancelled";
    default:
      return "pending_payment";
  }
}
