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

export const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/people/Mora-Hueso/61560327404163/",
    color: "#1877F2",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/morayhueso/",
    color: "#E1306C",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/524493916199",
    color: "#25D366",
  },
] as const;

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
