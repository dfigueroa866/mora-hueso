import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

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

export async function createCheckoutPreference(input: {
  orderId: string;
  trackingNumber: string;
  total: number;
  items: { title: string; quantity: number; unitPrice: number }[];
  payerEmail: string;
  payerName: string;
  baseUrl: string;
}) {
  const client = getMercadoPagoClient();
  const preference = new Preference(client);
  const isLocal =
    input.baseUrl.includes("localhost") || input.baseUrl.includes("127.0.0.1");

  const result = await preference.create({
    body: {
      items: input.items.map((item) => ({
        id: item.title.slice(0, 64),
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        currency_id: "MXN",
      })),
      payer: {
        email: input.payerEmail,
        name: input.payerName,
      },
      external_reference: input.orderId,
      statement_descriptor: "MORA Y HUESO",
      back_urls: {
        success: `${input.baseUrl}/confirmacion?status=approved&t=${input.trackingNumber}`,
        failure: `${input.baseUrl}/confirmacion?status=rejected&t=${input.trackingNumber}`,
        pending: `${input.baseUrl}/confirmacion?status=pending&t=${input.trackingNumber}`,
      },
      ...(isLocal
        ? {}
        : {
            auto_return: "approved" as const,
            notification_url: `${input.baseUrl}/api/mercadopago/webhook`,
          }),
      metadata: {
        tracking_number: input.trackingNumber,
      },
    },
  });

  return {
    preferenceId: result.id || "",
    initPoint: result.init_point || result.sandbox_init_point || "",
  };
}

export async function getPaymentById(paymentId: string) {
  const client = getMercadoPagoClient();
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
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
