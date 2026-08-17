"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/constants";
import { Suspense } from "react";

type Order = {
  trackingNumber: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  emailSentTo: string;
  items: { name: string; quantity: number; price: number }[];
};

function statusCopy(status: string) {
  switch (status) {
    case "confirmed":
    case "shipped":
      return {
        eyebrow: status === "shipped" ? "Pedido enviado" : "Pedido confirmado",
        headline: "¡Gracias por tu compra!",
        note: null as string | null,
      };
    case "pending_payment":
      return {
        eyebrow: "Pendiente de confirmación",
        headline: "Pago en proceso",
        note: "Mercado Pago aún está procesando tu pago. Esta página se actualizará cuando se confirme.",
      };
    case "cancelled":
      return {
        eyebrow: "Pago no completado",
        headline: "Pedido cancelado",
        note: "El pago no se completó. Puedes volver al checkout e intentarlo de nuevo.",
      };
    case "refunded":
      return {
        eyebrow: "Reembolso",
        headline: "Pedido reembolsado",
        note: "El importe fue reembolsado según el estado del pago.",
      };
    default:
      return {
        eyebrow: "Pedido",
        headline: "Estado del pedido",
        note: `Estado actual: ${status}`,
      };
  }
}

function ConfirmationInner() {
  const params = useSearchParams();
  const tracking = params.get("t");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tracking) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const res = await fetch(
          `/api/orders/by-tracking?t=${encodeURIComponent(tracking!)}`
        );
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Pedido no encontrado");
          return;
        }
        if (!cancelled) {
          setOrder(data.order);
          setError("");
          if (
            data.order.status === "confirmed" ||
            data.order.status === "pending_payment" ||
            data.order.status === "shipped"
          ) {
            try {
              localStorage.removeItem("mora-hueso-cart");
            } catch {
              /* ignore */
            }
            sessionStorage.removeItem("mh_shipping");
            sessionStorage.setItem("mh_order", JSON.stringify(data.order));
          }
          if (data.order.status === "pending_payment") {
            timer = setTimeout(load, 4000);
          }
        }
      } catch {
        if (!cancelled) setError("No se pudo cargar el pedido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [tracking]);

  if (!tracking) {
    return (
      <div className="section-pad text-center">
        <h1 className="font-display text-4xl">Confirmación</h1>
        <p className="mt-3 text-ink-muted">No hay un pedido reciente.</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (loading && !order) {
    return <div className="section-pad text-ink-muted">Cargando pedido…</div>;
  }

  if (error && !order) {
    return (
      <div className="section-pad text-center">
        <h1 className="font-display text-4xl">Confirmación</h1>
        <p className="mt-3 text-ink-muted">{error}</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const copy = statusCopy(order!.status);

  return (
    <div className="section-pad max-w-2xl">
      <p className="animate-fade-in text-xs uppercase tracking-[0.2em] text-sage">
        {copy.eyebrow}
      </p>
      <h1 className="mt-2 animate-fade-up font-display text-4xl font-semibold md:text-5xl">
        {copy.headline}
      </h1>
      <p className="mt-4 text-ink-muted">
        Número de seguimiento:{" "}
        <span className="font-medium text-ink">{order!.trackingNumber}</span>
      </p>
      {copy.note && (
        <p className="mt-2 text-sm text-ink-muted">{copy.note}</p>
      )}
      {order?.emailSentTo && order.status === "confirmed" && (
        <p className="mt-2 text-sm text-ink-muted">
          Confirmación enviada a{" "}
          <span className="text-ink">{order.emailSentTo}</span>.
        </p>
      )}

      {order && (
        <div className="mt-8 border border-ink/10 bg-white/60 p-6 animate-scale-in">
          <h2 className="font-display text-xl">Resumen</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between">
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>IVA</dt>
              <dd>{formatPrice(order.tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Envío</dt>
              <dd>{formatPrice(order.shippingCost)}</dd>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {order?.status === "cancelled" ? (
          <Link href="/checkout" className="btn-primary">
            Reintentar pago
          </Link>
        ) : (
          <Link href="/perfil" className="btn-primary">
            Ver mis pedidos
          </Link>
        )}
        <Link href="/#catalogo" className="btn-ghost">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={<div className="section-pad text-ink-muted">Cargando…</div>}
    >
      <ConfirmationInner />
    </Suspense>
  );
}
