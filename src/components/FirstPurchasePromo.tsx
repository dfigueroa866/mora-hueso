"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { FIRST_PURCHASE_DISCOUNT_RATE } from "@/lib/constants";

const STORAGE_KEY = "mh_first_purchase_promo_seen";

export function FirstPurchasePromo() {
  const [open, setOpen] = useState(false);
  const percent = Math.round(FIRST_PURCHASE_DISCOUNT_RATE * 100);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const id = window.setTimeout(() => setOpen(true), 450);
    return () => window.clearTimeout(id);
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-purchase-title"
    >
      <div className="relative w-full max-w-md animate-scale-in border border-ink/10 bg-bone px-6 py-7 shadow-none sm:px-8">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-ink-muted transition hover:text-ink"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-xs uppercase tracking-[0.22em] text-berry">
          Bienvenida
        </p>
        <h2
          id="first-purchase-title"
          className="mt-3 font-display text-3xl font-semibold leading-tight text-ink"
        >
          {percent}% de descuento en tu primera compra
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          El descuento se aplica automáticamente al pagar con un correo que
          aún no haya comprado en Mora &amp; Hueso. Válido sobre el subtotal de
          productos.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <a href="/#catalogo" className="btn-primary" onClick={dismiss}>
            Ver catálogo
          </a>
          <Link href="/registro" className="btn-ghost" onClick={dismiss}>
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
