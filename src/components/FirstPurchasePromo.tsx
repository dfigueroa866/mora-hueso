"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { FIRST_PURCHASE_DISCOUNT_RATE } from "@/lib/constants";
import {
  hasSeenFirstPurchasePromo,
  markFirstPurchasePromoSeen,
} from "@/lib/first-purchase-promo";

export function FirstPurchasePromo() {
  const [open, setOpen] = useState(false);
  const percent = Math.round(FIRST_PURCHASE_DISCOUNT_RATE * 100);

  useEffect(() => {
    if (hasSeenFirstPurchasePromo()) return;
    const id = window.setTimeout(() => setOpen(true), 350);
    return () => window.clearTimeout(id);
  }, []);

  function dismiss() {
    setOpen(false);
    markFirstPurchasePromoSeen();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-purchase-title"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-lg animate-scale-in overflow-hidden bg-berry shadow-[0_24px_60px_rgba(26,22,20,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-1.5 w-full bg-gradient-to-r from-bone via-berry-soft to-bone"
          aria-hidden
        />
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-4 flex h-10 w-10 items-center justify-center text-bone/80 transition hover:bg-bone/10 hover:text-bone"
          aria-label="Cerrar anuncio"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 pb-8 pt-8 text-center sm:px-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-bone/75">
            Anuncio · Oferta de bienvenida
          </p>

          <div className="mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-bone bg-bone">
            <span className="font-display text-4xl font-semibold leading-none text-berry">
              −{percent}%
            </span>
          </div>

          <h2
            id="first-purchase-title"
            className="mt-6 font-display text-3xl font-semibold leading-tight text-bone sm:text-4xl"
          >
            {percent}% extra en tu primera compra
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-bone/85">
            El descuento se aplica al pagar con un correo que aún no haya
            comprado en Mora &amp; Hueso. Válido sobre el subtotal de productos.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/#catalogo"
              className="inline-flex items-center justify-center bg-bone px-6 py-3 text-sm font-semibold text-berry transition hover:bg-white"
              onClick={dismiss}
            >
              Usar descuento
            </a>
            <Link
              href="/registro"
              className="inline-flex items-center justify-center border-2 border-bone/80 px-6 py-3 text-sm font-medium text-bone transition hover:bg-bone/15"
              onClick={dismiss}
            >
              Crear cuenta
            </Link>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="mt-4 text-xs text-bone/60 underline-offset-4 transition hover:text-bone hover:underline"
          >
            Cerrar y seguir navegando
          </button>
        </div>
      </div>
    </div>
  );
}
