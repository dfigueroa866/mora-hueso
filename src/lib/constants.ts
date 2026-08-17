export const CATEGORIES = [
  { value: "naturales", label: "Premios naturales" },
  { value: "galletas", label: "Galletas" },
  { value: "huesos", label: "Huesos" },
  { value: "dentales", label: "Snacks dentales" },
] as const;

export const DOG_SIZES = [
  { value: "pequeno", label: "Pequeño" },
  { value: "mediano", label: "Mediano" },
  { value: "grande", label: "Grande" },
  { value: "todos", label: "Todos los tamaños" },
] as const;

export const SHIPPING_METHODS = [
  {
    value: "standard",
    label: "Envío estándar",
    cost: 79,
    eta: "3–5 días hábiles",
  },
  {
    value: "express",
    label: "Envío exprés",
    cost: 149,
    eta: "1–2 días hábiles",
  },
] as const;

export const TAX_RATE = Number(process.env.NEXT_PUBLIC_TAX_RATE || "0.16");

/** Estados de pedido usados en la app. */
export const ORDER_STATUSES = [
  "pending_payment",
  "confirmed",
  "shipped",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Pedidos que cuentan como ingreso. */
export const REVENUE_ORDER_STATUSES: OrderStatus[] = ["confirmed", "shipped"];

export const FINAL_ORDER_STATUSES: OrderStatus[] = [
  "confirmed",
  "shipped",
  "cancelled",
  "refunded",
];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isFinalOrderStatus(status: string) {
  return (FINAL_ORDER_STATUSES as readonly string[]).includes(status);
}

export function getPendingPaymentTtlMinutes() {
  const n = Number(process.env.MERCADOPAGO_PENDING_TTL_MINUTES || "30");
  return Number.isFinite(n) && n > 0 ? n : 30;
}

export function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function dogSizeLabel(value: string) {
  return DOG_SIZES.find((d) => d.value === value)?.label ?? value;
}

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

export function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

export function generateTrackingNumber() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `MH-${n}`;
}

export function isAvailable(stock: number) {
  return stock > 0;
}
