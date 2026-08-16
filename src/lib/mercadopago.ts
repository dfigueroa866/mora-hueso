const MP_API = "https://api.mercadopago.com";

export function getMercadoPagoAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Falta MERCADOPAGO_ACCESS_TOKEN en el entorno");
  }
  return token;
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export type MercadoPagoPreferenceItem = {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
};

export type CreatePreferenceInput = {
  items: MercadoPagoPreferenceItem[];
  payerEmail: string;
  payerName: string;
  externalReference: string;
  notificationUrl?: string;
  backUrls: {
    success: string;
    pending: string;
    failure: string;
  };
};

export type MercadoPagoPreference = {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
};

export async function createMercadoPagoPreference(
  input: CreatePreferenceInput
): Promise<MercadoPagoPreference> {
  const token = getMercadoPagoAccessToken();

  const body = {
    items: input.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: item.currency_id || "MXN",
    })),
    payer: {
      email: input.payerEmail,
      name: input.payerName,
    },
    back_urls: input.backUrls,
    auto_return: "approved" as const,
    external_reference: input.externalReference,
    notification_url: input.notificationUrl,
    statement_descriptor: "MORA Y HUESO",
    metadata: {
      store: "mora-hueso",
      order_id: input.externalReference,
    },
  };

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      "No se pudo crear la preferencia de Mercado Pago";
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  if (!data?.id || !data?.init_point) {
    throw new Error("Respuesta incompleta de Mercado Pago");
  }

  return {
    id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
  };
}

export type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
};

export async function getMercadoPagoPayment(
  paymentId: string
): Promise<MercadoPagoPayment> {
  const token = getMercadoPagoAccessToken();
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.message || `No se pudo consultar el pago ${paymentId}`
    );
  }

  return data as MercadoPagoPayment;
}

export function mapPaymentStatusToOrderStatus(status: string) {
  switch (status) {
    case "approved":
      return "confirmed";
    case "pending":
    case "in_process":
    case "in_mediation":
      return "pending_payment";
    case "rejected":
    case "cancelled":
      return "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending_payment";
  }
}
