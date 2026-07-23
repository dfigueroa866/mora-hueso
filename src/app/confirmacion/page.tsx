"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/constants";
import { Suspense } from "react";

type Order = {
  trackingNumber: string;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  emailSentTo: string;
  items: { name: string; quantity: number; price: number }[];
};

function ConfirmationInner() {
  const params = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("mh_order");
    if (raw) {
      setOrder(JSON.parse(raw));
    }
  }, []);

  const tracking = params.get("t") || order?.trackingNumber;

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

  return (
    <div className="section-pad max-w-2xl">
      <p className="animate-fade-in text-xs uppercase tracking-[0.2em] text-sage">
        Pedido confirmado
      </p>
      <h1 className="mt-2 animate-fade-up font-display text-4xl font-semibold md:text-5xl">
        ¡Gracias por tu compra!
      </h1>
      <p className="mt-4 text-ink-muted">
        Número de seguimiento:{" "}
        <span className="font-medium text-ink">{tracking}</span>
      </p>
      {order?.emailSentTo && (
        <p className="mt-2 text-sm text-ink-muted">
          Enviamos el resumen a{" "}
          <span className="text-ink">{order.emailSentTo}</span> (demo: también
          en la consola del servidor).
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
        <Link href="/perfil" className="btn-primary">
          Ver mis pedidos
        </Link>
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
