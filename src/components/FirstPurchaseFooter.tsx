"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { FIRST_PURCHASE_DISCOUNT_RATE } from "@/lib/constants";
import {
  FIRST_PURCHASE_PROMO_DISMISSED_EVENT,
  hasDismissedFirstPurchaseFooter,
  hasSeenFirstPurchasePromo,
  markFirstPurchaseFooterDismissed,
} from "@/lib/first-purchase-promo";

export function FirstPurchaseFooter() {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const percent = Math.round(FIRST_PURCHASE_DISCOUNT_RATE * 100);

  useEffect(() => {
    const sync = () =>
      setVisible(
        hasSeenFirstPurchasePromo() && !hasDismissedFirstPurchaseFooter()
      );
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

  function dismiss() {
    markFirstPurchaseFooterDismissed();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-30 bg-berry pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] shadow-[0_-8px_24px_rgba(139,58,74,0.4)]"
    >
      <div
        className="h-0.5 w-full bg-gradient-to-r from-bone via-berry-soft to-bone"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-2.5 lg:px-8">
        <p className="min-w-0 flex-1 truncate font-display text-sm font-semibold leading-tight text-bone sm:text-base">
          <span className="mr-2 hidden rounded-full bg-bone/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] sm:inline">
            Oferta
          </span>
          {percent}% extra en tu primera compra
        </p>
        <a
          href="/#catalogo"
          className="inline-flex shrink-0 items-center justify-center bg-bone px-3 py-1.5 text-xs font-semibold text-berry transition hover:bg-white sm:px-4 sm:py-2 sm:text-sm"
        >
          Usar descuento
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-bone/80 transition hover:bg-bone/10 hover:text-bone"
          aria-label="Cerrar oferta de bienvenida"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
