"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/constants";

type OrderView = {
  id: string;
  trackingNumber: string;
  status: string;
  statusLabel?: string;
  total: number;
  subtotal: number;
  discount?: number;
  tax: number;
  shippingCost: number;
  billingEmail?: string;
  emailSentTo?: string;
  firstPurchaseDiscount?: boolean;
  items: { name: string; quantity: number; price: number }[];
};

function ConfirmationInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);

  const tracking = params.get("t") || "";
  const statusHint = params.get("status") || params.get("collection_status") || "";
  const paymentId =
    params.get("payment_id") || params.get("collection_id") || "";

  useEffect(() => {
    async function run() {
      const raw = sessionStorage.getItem("mh_order");
      let local: OrderView | null = null;
      if (raw) {
        try {
          local = JSON.parse(raw);
        } catch {
          local = null;
        }
      }

      const t = tracking || local?.trackingNumber || "";
      if (!t) {
        setLoading(false);
        return;
      }

      if (statusHint || paymentId) {
        try {
          const sync = await fetch("/api/mercadopago/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trackingNumber: t,
              paymentId: paymentId || undefined,
              status: statusHint || undefined,
            }),
          });
          const syncData = await sync.json();
          if (sync.ok && syncData.order) {
            setOrder({
              ...syncData.order,
              emailSentTo: syncData.order.billingEmail,
            });
            sessionStorage.setItem("mh_order", JSON.stringify(syncData.order));
            setLoading(false);
            return;
          }
        } catch {
          /* fall through */
        }
      }

      try {
        const res = await fetch(`/api/orders/tracking/${encodeURIComponent(t)}`);
        const data = await res.json();
        if (res.ok && data.order) {
          setOrder({
            ...data.order,
            emailSentTo: data.order.billingEmail,
          });
          sessionStorage.setItem("mh_order", JSON.stringify(data.order));
        } else if (local) {
          setOrder(local);
        }
      } catch {
        if (local) setOrder(local);
      } finally {
        setLoading(false);
      }
    }
    void run();
  }, [tracking, statusHint, paymentId]);

  if (loading) {
    return <div className="section-pad text-ink-muted">Confirmando pago…</div>;
  }

  if (!order && !tracking) {
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

  const status = order?.status || "";
  const isPaid = status === "paid" || status === "shipped" || status === "confirmed";
  const isPending = status === "pending_payment" || statusHint === "pending";
  const isCancelled =
    status === "cancelled" ||
    statusHint === "rejected" ||
    statusHint === "failure";

  return (
    <div className="section-pad max-w-2xl">
      <p
        className={`animate-fade-in text-xs uppercase tracking-[0.2em] ${
          isPaid ? "text-sage" : isCancelled ? "text-berry" : "text-ink-muted"
        }`}
      >
        {isPaid
          ? "Pago confirmado"
          : isCancelled
            ? "Pago no completado"
            : "Pago pendiente"}
      </p>
      <h1 className="mt-2 animate-fade-up font-display text-4xl font-semibold md:text-5xl">
        {isPaid
          ? "¡Gracias por tu compra!"
          : isCancelled
            ? "No se pudo cobrar"
            : "Estamos confirmando tu pago"}
      </h1>
      <p className="mt-4 text-ink-muted">
        Número de seguimiento:{" "}
        <span className="font-medium text-ink">
          {order?.trackingNumber || tracking}
        </span>
      </p>
      {order?.statusLabel && (
        <p className="mt-2 text-sm text-ink-muted">
          Estado: <span className="text-ink">{order.statusLabel}</span>
        </p>
      )}
      {order?.emailSentTo && isPaid && (
        <p className="mt-2 text-sm text-ink-muted">
          Enviaremos el resumen a{" "}
          <span className="text-ink">{order.emailSentTo}</span>.
        </p>
      )}

      {isPending && (
        <p className="mt-4 text-sm text-ink-muted">
          Si elegiste un medio en efectivo, el pedido se marcará como pagado
          cuando Mercado Pago confirme la acreditación.
        </p>
      )}

      {isCancelled && (
        <p className="mt-4 text-sm text-ink-muted">
          El stock se liberó. Puedes volver al carrito e intentar de nuevo.
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
            {(order.discount ?? 0) > 0 && (
              <div className="flex justify-between text-sage">
                <dt>Descuento primera compra (10%)</dt>
                <dd>−{formatPrice(order.discount!)}</dd>
              </div>
            )}
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
        {isCancelled ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => router.push("/#catalogo")}
          >
            Volver al catálogo
          </button>
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
