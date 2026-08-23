import { prisma } from "@/lib/db";
import {
  FIRST_PURCHASE_DISCOUNT_RATE,
  TAX_RATE,
  roundMoney,
} from "@/lib/constants";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Primera compra = no hay pedidos completados previos con ese correo. */
export async function isFirstPurchaseEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  // SQLite: comparación case-insensitive por correo facturación / invitado.
  const rows = await prisma.$queryRaw<Array<{ c: bigint | number }>>`
    SELECT COUNT(*) as c FROM "Order"
    WHERE status IN ('paid', 'shipped', 'confirmed')
      AND (
        lower(billingEmail) = ${normalized}
        OR (guestEmail IS NOT NULL AND lower(guestEmail) = ${normalized})
      )
  `;

  const count = Number(rows[0]?.c ?? 0);
  return count === 0;
}

export function calcOrderTotals(input: {
  subtotal: number;
  shippingCost: number;
  applyFirstPurchaseDiscount: boolean;
}) {
  const discount = input.applyFirstPurchaseDiscount
    ? roundMoney(input.subtotal * FIRST_PURCHASE_DISCOUNT_RATE)
    : 0;
  const taxable = roundMoney(Math.max(0, input.subtotal - discount));
  const tax = roundMoney(taxable * TAX_RATE);
  const total = roundMoney(taxable + tax + input.shippingCost);
  return { discount, tax, total, taxable };
}
