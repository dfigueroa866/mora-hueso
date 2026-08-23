"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FIRST_PURCHASE_DISCOUNT_RATE } from "@/lib/constants";
import {
  FIRST_PURCHASE_PROMO_DISMISSED_EVENT,
  hasSeenFirstPurchasePromo,
} from "@/lib/first-purchase-promo";

export function FirstPurchaseFooter() {
  const [visible, setVisible] = useState(false);
  const percent = Math.round(FIRST_PURCHASE_DISCOUNT_RATE * 100);

  useEffect(() => {
    const sync = () => setVisible(hasSeenFirstPurchasePromo());
    sync();
    window.addEventListener(FIRST_PURCHASE_PROMO_DISMISSED_EVENT, sync);
    return () =>
      window.removeEventListener(FIRST_PURCHASE_PROMO_DISMISSED_EVENT, sync);
  }, []);

  if (!visible) return null;

  return (
    <div className="border-t border-bone/10 bg-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-berry">
            Primera compra
          </p>
          <p className="mt-1 font-display text-lg text-bone sm:text-xl">
            {percent}% de descuento en tu primera compra
          </p>
          <p className="mt-1 text-sm text-bone/60">
            Se aplica al pagar con un correo que aún no haya comprado aquí.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/#catalogo"
            className="inline-flex items-center justify-center border border-bone/30 bg-bone px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-white"
          >
            Usar descuento
          </a>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center border border-bone/25 px-4 py-2.5 text-sm text-bone/85 transition hover:border-bone/50 hover:text-bone"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
