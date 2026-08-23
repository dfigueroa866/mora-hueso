"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/constants";

type OrderView = {
  id: string;
  trackingNumber: string;
  total: number;
  status: string;
  items: { name: string; quantity: number; price: number }[];
};

function DemoCheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const tracking = params.get("t") || "";
  const orderId = params.get("orderId") || "";
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!tracking) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders/tracking/${encodeURIComponent(tracking)}`);
        const data = await res.json();
        if (res.ok) setOrder(data.order);
      } catch {
        setError("No se pudo cargar el pedido");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [tracking]);

  async function finish(demoStatus: "approved" | "rejected") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/mercadopago/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: tracking,
          demoStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo simular el pago");
        return;
      }
      sessionStorage.setItem("mh_order", JSON.stringify(data.order));
      router.push(
        `/confirmacion?status=${demoStatus}&t=${encodeURIComponent(tracking)}`
      );
    } catch {
      setError("Error de red");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="section-pad text-ink-muted">Cargando demo de pago…</div>;
  }

  if (!order) {
    return (
      <div className="section-pad text-center">
        <h1 className="font-display text-4xl">Pago demo</h1>
        <p className="mt-3 text-ink-muted">Pedido no encontrado.</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="section-pad max-w-lg">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Modo demo
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold">
        Simular Mercado Pago
      </h1>
      <p className="mt-3 text-sm text-ink-muted">
        No hay <code className="text-xs">MERCADOPAGO_ACCESS_TOKEN</code>. Este
        paso imita la redirección de Checkout Pro para desarrollo local.
      </p>
      <div className="mt-6 border border-ink/10 bg-white/60 p-5 text-sm">
        <p>
          Pedido <span className="font-medium">{order.trackingNumber}</span>
        </p>
        {orderId && (
          <p className="text-ink-muted text-xs mt-1">ID: {orderId}</p>
        )}
        <p className="mt-3 text-lg font-semibold">{formatPrice(order.total)}</p>
        <ul className="mt-3 space-y-1 text-ink-muted">
          {order.items.map((i, idx) => (
            <li key={idx}>
              {i.name} × {i.quantity}
            </li>
          ))}
        </ul>
      </div>
      {error && <p className="mt-4 text-sm text-berry">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() => void finish("approved")}
        >
          {busy ? "Procesando…" : "Simular pago aprobado"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          onClick={() => void finish("rejected")}
        >
          Simular pago rechazado
        </button>
      </div>
    </div>
  );
}

export default function DemoPaymentPage() {
  return (
    <Suspense
      fallback={<div className="section-pad text-ink-muted">Cargando…</div>}
    >
      <DemoCheckoutInner />
    </Suspense>
  );
}
