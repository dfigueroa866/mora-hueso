"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { items, clear, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);
  const [shipping, setShipping] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    billingName: "",
    billingEmail: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });

  useEffect(() => {
    setMounted(true);
    const raw = sessionStorage.getItem("mh_shipping");
    if (raw) setShipping(JSON.parse(raw));
    const status = new URLSearchParams(window.location.search).get("status");
    if (status === "failure") {
      setError(
        "El pago con Mercado Pago no se completó. Puedes intentar de nuevo."
      );
    }
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

  function checkoutPayload(includeCard: boolean) {
    const base = {
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
    };
    if (!includeCard) return base;
    return {
      ...base,
      cardNumber: form.cardNumber,
      cardExpiry: form.cardExpiry,
      cardCvc: form.cardCvc,
    };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload(true)),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo completar el pago");
        return;
      }
      clear();
      sessionStorage.removeItem("mh_shipping");
      sessionStorage.setItem("mh_order", JSON.stringify(data.order));
      router.push(`/confirmacion?t=${data.order.trackingNumber}`);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function payWithMercadoPago() {
    setError("");
    if (!form.billingName.trim() || !form.billingEmail.trim()) {
      setError("Completa nombre y correo antes de pagar con Mercado Pago.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutPayload(false)),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar Mercado Pago");
        return;
      }
      sessionStorage.setItem("mh_order", JSON.stringify(data.order));
      window.location.href = data.initPoint;
    } catch {
      setError("Error de red al conectar con Mercado Pago.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-pad">
      <h1 className="font-display text-4xl font-semibold">Pago</h1>
      <p className="mt-2 text-ink-muted">
        Datos de facturación y tarjeta (simulación segura local).
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="billingName">
              Nombre en la tarjeta
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
          <div>
            <label className="label" htmlFor="cardNumber">
              Número de tarjeta
            </label>
            <input
              id="cardNumber"
              className="field"
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={19}
              required
              value={form.cardNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                setForm({ ...form, cardNumber: formatted });
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="cardExpiry">
                Vencimiento (MM/AA)
              </label>
              <input
                id="cardExpiry"
                className="field"
                placeholder="12/28"
                required
                value={form.cardExpiry}
                onChange={(e) =>
                  setForm({ ...form, cardExpiry: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="cardCvc">
                CVC
              </label>
              <input
                id="cardCvc"
                className="field"
                placeholder="123"
                required
                value={form.cardCvc}
                onChange={(e) => setForm({ ...form, cardCvc: e.target.value })}
              />
            </div>
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

          {error && <p className="text-sm text-berry">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Procesando…" : `Pagar con tarjeta ${formatPrice(total)}`}
          </button>
          <button
            type="button"
            className="btn-ink w-full"
            disabled={loading}
            onClick={payWithMercadoPago}
          >
            {loading ? "Conectando…" : "Pagar con Mercado Pago"}
          </button>
          <p className="text-xs text-ink-muted">
            Mercado Pago abre su checkout seguro (tarjetas, SPEI, saldo, etc.).
            No necesitas llenar los datos de tarjeta de arriba.
          </p>
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
