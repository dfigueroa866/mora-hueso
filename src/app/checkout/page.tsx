"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import {
  SHIPPING_METHODS,
  formatPrice,
  TAX_RATE,
  roundMoney,
} from "@/lib/constants";

type ShippingData = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  references: string;
  shippingMethod: "standard" | "express";
};

export default function CheckoutPage() {
  const { items, clear, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);
  const [shipping, setShipping] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    billingName: "",
    billingEmail: "",
  });

  useEffect(() => {
    setMounted(true);
    const raw = sessionStorage.getItem("mh_shipping");
    if (raw) setShipping(JSON.parse(raw));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setForm((f) => ({
            ...f,
            billingName: d.user.name,
            billingEmail: d.user.email,
          }));
        }
      })
      .catch(() => {});
  }, []);

  if (!mounted) {
    return <div className="section-pad text-ink-muted">Cargando…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="section-pad text-center">
        <h1 className="font-display text-4xl">Checkout</h1>
        <p className="mt-3 text-ink-muted">No hay productos en el carrito.</p>
        <Link href="/#catalogo" className="btn-primary mt-6 inline-flex">
          Ver catálogo
        </Link>
      </div>
    );
  }

  if (!shipping) {
    return (
      <div className="section-pad text-center">
        <h1 className="font-display text-4xl">Checkout</h1>
        <p className="mt-3 text-ink-muted">
          Primero completa la dirección de envío.
        </p>
        <Link href="/envio" className="btn-primary mt-6 inline-flex">
          Ir a envío
        </Link>
      </div>
    );
  }

  const method = SHIPPING_METHODS.find(
    (m) => m.value === shipping.shippingMethod
  )!;
  const sub = subtotal();
  const tax = roundMoney(sub * TAX_RATE);
  const total = roundMoney(sub + tax + method.cost);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          shippingMethod: shipping!.shippingMethod,
          shipStreet: shipping!.street,
          shipCity: shipping!.city,
          shipState: shipping!.state,
          shipPostalCode: shipping!.postalCode,
          shipCountry: shipping!.country,
          shipReferences: shipping!.references,
          billingName: form.billingName,
          billingEmail: form.billingEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar el pago");
        return;
      }
      sessionStorage.setItem("mh_order", JSON.stringify(data.order));
      sessionStorage.removeItem("mh_shipping");
      clear();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setError("No se recibió URL de pago");
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-pad">
      <h1 className="font-display text-4xl font-semibold">Pago</h1>
      <p className="mt-2 text-ink-muted">
        Confirma tus datos y paga de forma segura con Mercado Pago.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="billingName">
              Nombre completo
            </label>
            <input
              id="billingName"
              className="field"
              required
              value={form.billingName}
              onChange={(e) =>
                setForm({ ...form, billingName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="billingEmail">
              Correo de confirmación
            </label>
            <input
              id="billingEmail"
              type="email"
              className="field"
              required
              value={form.billingEmail}
              onChange={(e) =>
                setForm({ ...form, billingEmail: e.target.value })
              }
            />
          </div>

          <div className="border border-ink/10 bg-white/50 p-4 text-sm text-ink-muted">
            <p className="font-medium text-ink">Envío a</p>
            <p className="mt-1">
              {shipping.street}, {shipping.city}, {shipping.state}{" "}
              {shipping.postalCode}
            </p>
            <p>
              {shipping.country} · {method.label} ({method.eta})
            </p>
          </div>

          <div className="border border-[#009EE3]/20 bg-[#009EE3]/5 p-4 text-sm text-ink/80">
            <p className="font-medium text-ink">Mercado Pago</p>
            <p className="mt-1 text-ink-muted">
              Te redirigiremos a Mercado Pago para completar el cobro con
              tarjeta, saldo o efectivo. No almacenamos datos de tu tarjeta.
            </p>
          </div>

          {error && <p className="text-sm text-berry">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Redirigiendo…" : `Pagar ${formatPrice(total)} con Mercado Pago`}
          </button>
        </div>

        <aside className="h-fit border border-ink/10 bg-white/60 p-6">
          <h2 className="font-display text-xl">Resumen del pedido</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span className="text-ink-muted">
                  {i.name} × {i.quantity}
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd>{formatPrice(sub)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">IVA ({TAX_RATE * 100}%)</dt>
              <dd>{formatPrice(tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Envío</dt>
              <dd>{formatPrice(method.cost)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
        </aside>
      </form>
    </div>
  );
}
