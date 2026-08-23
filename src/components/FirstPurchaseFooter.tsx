"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FIRST_PURCHASE_DISCOUNT_RATE } from "@/lib/constants";
import {
  FIRST_PURCHASE_PROMO_DISMISSED_EVENT,
  hasSeenFirstPurchasePromo,
} from "@/lib/first-purchase-promo";

export function FirstPurchaseFooter() {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const percent = Math.round(FIRST_PURCHASE_DISCOUNT_RATE * 100);

  useEffect(() => {
    const sync = () => setVisible(hasSeenFirstPurchasePromo());
    sync();
    window.addEventListener(FIRST_PURCHASE_PROMO_DISMISSED_EVENT, sync);
    return () =>
      window.removeEventListener(FIRST_PURCHASE_PROMO_DISMISSED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const el = barRef.current;
    if (!el) return;

    const applyPad = () => {
      document.body.style.paddingBottom = `${el.offsetHeight}px`;
    };
    applyPad();
    const observer = new ResizeObserver(applyPad);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.body.style.paddingBottom = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-30 overflow-hidden bg-berry shadow-[0_-12px_32px_rgba(139,58,74,0.45)]"
    >
      <div
        className="h-1 w-full bg-gradient-to-r from-bone via-berry-soft to-bone"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(246,241,232,0.16),transparent_55%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-bone bg-bone text-center shadow-sm sm:flex">
            <span className="font-display text-2xl font-semibold leading-none text-berry">
              −{percent}%
            </span>
          </div>
          <div>
            <p className="inline-flex items-center rounded-full bg-bone/15 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.2em] text-bone">
              Oferta de bienvenida
            </p>
            <p className="mt-1 font-display text-xl font-semibold leading-tight text-bone sm:text-2xl">
              {percent}% extra en tu primera compra
            </p>
            <p className="mt-0.5 text-sm text-bone/80">
              Se aplica al pagar con un correo que aún no haya comprado aquí.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <a
            href="/#catalogo"
            className="inline-flex items-center justify-center bg-bone px-5 py-2.5 text-sm font-semibold text-berry shadow-sm transition hover:bg-white"
          >
            Usar descuento
          </a>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center border-2 border-bone/80 bg-transparent px-5 py-2.5 text-sm font-medium text-bone transition hover:bg-bone/15"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
