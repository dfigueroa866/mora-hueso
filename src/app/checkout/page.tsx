"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cartSubtotal, useCart } from "@/lib/cart-store";
import {
  SHIPPING_METHODS,
  formatPrice,
  TAX_RATE,
  FIRST_PURCHASE_DISCOUNT_RATE,
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

/**
 * Pop-up centrado al marco de Checkout Pro (dos columnas: pago + detalle).
 * Sin document.write: eso dejaba el botón Pagar deshabilitado.
 */
function openPayWindow() {
  const availW = window.screen.availWidth;
  const availH = window.screen.availHeight;
  const width = Math.min(1024, Math.max(720, availW - 48));
  const height = Math.min(820, Math.max(640, availH - 48));
  const left = Math.max(0, Math.round((availW - width) / 2));
  const top = Math.max(0, Math.round((availH - height) / 2));
  return window.open(
    "about:blank",
    "mh-mp-checkout",
    [
      "popup=yes",
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      "resizable=yes",
      "scrollbars=yes",
      "location=yes",
      "menubar=no",
      "toolbar=no",
      "status=no",
    ].join(",")
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => (Array.isArray(s.items) ? s.items : []));
  const clearCart = useCart((s) => s.clear);
  const payPopup = useRef<Window | null>(null);
  const paidLock = useRef(false);
  const pollRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [shipping, setShipping] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [waitingPopup, setWaitingPopup] = useState(false);
  const [error, setError] = useState("");
  const [firstPurchase, setFirstPurchase] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [form, setForm] = useState({
    billingName: "",
    billingEmail: "",
  });

  useEffect(() => {
    setMounted(true);
    const raw = sessionStorage.getItem("mh_shipping");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ShippingData;
        if (parsed && typeof parsed.street === "string") setShipping(parsed);
        else sessionStorage.removeItem("mh_shipping");
      } catch {
        sessionStorage.removeItem("mh_shipping");
      }
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

  useEffect(() => {
    const email = form.billingEmail.trim();
    if (!email.includes("@")) {
      setFirstPurchase(false);
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await fetch(
          `/api/orders/first-purchase?email=${encodeURIComponent(email)}`,
          { signal: ctrl.signal }
        );
        const data = await res.json();
        if (res.ok) setFirstPurchase(Boolean(data.eligible));
        else setFirstPurchase(false);
      } catch {
        if (!ctrl.signal.aborted) setFirstPurchase(false);
      } finally {
        if (!ctrl.signal.aborted) setCheckingEmail(false);
      }
    }, 350);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [form.billingEmail]);

  const method = shipping
    ? SHIPPING_METHODS.find((m) => m.value === shipping.shippingMethod)!
    : null;
  const sub = useMemo(() => roundMoney(cartSubtotal(items)), [items]);
  const discount = useMemo(
    () =>
      firstPurchase
        ? roundMoney(sub * FIRST_PURCHASE_DISCOUNT_RATE)
        : 0,
    [firstPurchase, sub]
  );
  const taxable = roundMoney(Math.max(0, sub - discount));
  const tax = roundMoney(taxable * TAX_RATE);
  const total = method ? roundMoney(taxable + tax + method.cost) : 0;

  function completePaid(tracking: string) {
    if (paidLock.current || !tracking) return;
    paidLock.current = true;
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    sessionStorage.setItem("mh_confirming", "1");
    setRedirecting(true);
    setWaitingPopup(false);
    try {
      payPopup.current?.close();
    } catch {
      /* la ventana de Mercado Pago ya se cerró */
    }
    sessionStorage.removeItem("mh_shipping");
    sessionStorage.removeItem("mh_order");
    clearCart();
    router.replace(
      `/confirmacion?status=approved&t=${encodeURIComponent(tracking)}`
    );
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    function onPaid(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "mh-mp-paid") return;
      completePaid(String(event.data.tracking || ""));
    }
    window.addEventListener("message", onPaid);
    return () => window.removeEventListener("message", onPaid);
  }, [router, clearCart]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const popup = openPayWindow();
    if (!popup) {
      setError(
        "El navegador bloqueó la ventana de pago. Permite pop-ups para este sitio e inténtalo de nuevo."
      );
      return;
    }
    payPopup.current = popup;
    setLoading(true);
    setWaitingPopup(true);
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
        popup.close();
        setWaitingPopup(false);
        setError(data.error || "No se pudo iniciar el pago");
        return;
      }
      sessionStorage.setItem("mh_order", JSON.stringify(data.order));
      const checkoutUrl = String(data.checkoutUrl || "");
      const allowed =
        /^https:\/\/([a-z0-9-]+\.)*mercadopago\.com/i.test(checkoutUrl) ||
        checkoutUrl.startsWith(window.location.origin);
      if (!allowed) {
        popup.close();
        setWaitingPopup(false);
        setError("Mercado Pago no devolvió un enlace de pago válido.");
        return;
      }
      popup.location.href = checkoutUrl;
      const tracking = String(data.order?.trackingNumber || "");
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(async () => {
        let closed = false;
        try {
          closed = popup.closed;
        } catch {
          closed = true;
        }
        if (!tracking) {
          if (closed && pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
            setWaitingPopup(false);
          }
          return;
        }
        try {
          const sync = await fetch("/api/mercadopago/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackingNumber: tracking }),
          });
          const syncData = await sync.json();
          if (syncData.order?.status === "paid") {
            completePaid(tracking);
            return;
          }
        } catch {
          /* reintenta en el siguiente ciclo */
        }
        if (closed && pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
          setWaitingPopup(false);
        }
      }, 1200);
    } catch {
      popup.close();
      setWaitingPopup(false);
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const percent = Math.round(FIRST_PURCHASE_DISCOUNT_RATE * 100);
  const confirming =
    redirecting ||
    (mounted && sessionStorage.getItem("mh_confirming") === "1");

  if (!mounted || confirming) {
    return (
      <div className="section-pad text-ink-muted">Confirmando pago…</div>
    );
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

  if (!shipping || !method) {
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
            {checkingEmail && (
              <p className="mt-1.5 text-xs text-ink-muted">
                Verificando descuento de primera compra…
              </p>
            )}
            {!checkingEmail && firstPurchase && form.billingEmail.includes("@") && (
              <p className="mt-1.5 text-xs text-sage">
                ¡Listo! Este correo aplica {percent}% de descuento en su primera
                compra.
              </p>
            )}
            {!checkingEmail &&
              !firstPurchase &&
              form.billingEmail.includes("@") && (
                <p className="mt-1.5 text-xs text-ink-muted">
                  Este correo ya tiene una compra previa; el descuento de
                  primera compra no aplica.
                </p>
              )}
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
              Al pagar se abre una ventana de Mercado Pago, del tamaño de su
              checkout. Esta página se queda abierta para registrar el
              resultado. No almacenamos datos de tu tarjeta.
            </p>
            <p className="mt-2 text-ink-muted">
              En pruebas, abre esta tienda en incógnito y entra a Mercado Pago
              con la cuenta compradora, no con la vendedora. Si pagas con la
              misma cuenta que creó el cobro, el botón Pagar queda gris.
            </p>
          </div>

          {error && <p className="text-sm text-berry">{error}</p>}
          {waitingPopup && (
            <p className="text-sm text-ink-muted">
              Completa el pago en la ventana de Mercado Pago. Al acreditarse,
              la cerramos y te mostramos la confirmación.
            </p>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || waitingPopup}
          >
            {loading
              ? "Abriendo Mercado Pago…"
              : `Pagar ${formatPrice(total)} con Mercado Pago`}
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
            {discount > 0 && (
              <div className="flex justify-between text-sage">
                <dt>Descuento primera compra ({percent}%)</dt>
                <dd>−{formatPrice(discount)}</dd>
              </div>
            )}
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
