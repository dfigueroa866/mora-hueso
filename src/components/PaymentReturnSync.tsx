"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";

/** En local Mercado Pago no redirige de vuelta. Al reabrir la tienda, confirma el cobro. */
export function PaymentReturnSync() {
  const router = useRouter();
  const pathname = usePathname();
  const clearCart = useCart((s) => s.clear);

  useEffect(() => {
    const raw = sessionStorage.getItem("mh_order");
    if (!raw) return;
    let tracking = "";
    let storedStatus = "";
    try {
      const parsed = JSON.parse(raw) as {
        trackingNumber?: string;
        status?: string;
      };
      tracking = String(parsed.trackingNumber || "");
      storedStatus = String(parsed.status || "");
    } catch {
      sessionStorage.removeItem("mh_order");
      return;
    }
    if (!tracking) return;
    if (storedStatus === "paid" || storedStatus === "cancelled") {
      sessionStorage.removeItem("mh_order");
      return;
    }

    let cancelled = false;
    fetch("/api/mercadopago/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: tracking }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const status = String(data.order?.status || "");
        if (status !== "paid" && status !== "cancelled") return;
        sessionStorage.removeItem("mh_order");
        sessionStorage.removeItem("mh_shipping");
        if (status === "paid") {
          sessionStorage.setItem("mh_confirming", "1");
          clearCart();
          if (!pathname.startsWith("/confirmacion")) {
            router.replace(
              `/confirmacion?status=approved&t=${encodeURIComponent(tracking)}`
            );
          }
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [pathname, router, clearCart]);

  return null;
}
