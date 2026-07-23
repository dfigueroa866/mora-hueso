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

type Address = {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  references: string | null;
  isDefault: boolean;
};

export default function ShippingPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal);
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "México",
    references: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.addresses) return;
        setAddresses(data.addresses);
        const def =
          data.addresses.find((a: Address) => a.isDefault) ||
          data.addresses[0];
        if (def) {
          setForm({
            street: def.street,
            city: def.city,
            state: def.state || "",
            postalCode: def.postalCode,
            country: def.country,
            references: def.references || "",
          });
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
        <h1 className="font-display text-4xl">Envío</h1>
        <p className="mt-3 text-ink-muted">Primero agrega productos al carrito.</p>
        <Link href="/#catalogo" className="btn-primary mt-6 inline-flex">
          Ver catálogo
        </Link>
      </div>
    );
  }

  const shipping = SHIPPING_METHODS.find((m) => m.value === method)!;
  const sub = subtotal();
  const tax = roundMoney(sub * TAX_RATE);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (
      form.street.length < 5 ||
      form.city.length < 2 ||
      form.state.length < 2 ||
      form.postalCode.length < 4
    ) {
      setError("Completa la dirección de envío correctamente.");
      return;
    }
    sessionStorage.setItem(
      "mh_shipping",
      JSON.stringify({ ...form, shippingMethod: method })
    );
    router.push("/checkout");
  }

  return (
    <div className="section-pad">
      <h1 className="font-display text-4xl font-semibold">Envío</h1>
      <p className="mt-2 text-ink-muted">
        Dirección de entrega y método de envío.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-10 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]"
      >
        <div className="space-y-6">
          {addresses.length > 0 && (
            <div>
              <label className="label">Direcciones guardadas</label>
              <select
                className="field"
                defaultValue=""
                onChange={(e) => {
                  const a = addresses.find((x) => x.id === e.target.value);
                  if (!a) return;
                  setForm({
                    street: a.street,
                    city: a.city,
                    state: a.state || "",
                    postalCode: a.postalCode,
                    country: a.country,
                    references: a.references || "",
                  });
                }}
              >
                <option value="">Seleccionar…</option>
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.street}, {a.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label" htmlFor="street">
              Calle y número
            </label>
            <input
              id="street"
              className="field"
              required
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="city">
                Ciudad
              </label>
              <input
                id="city"
                className="field"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="state">
                Estado
              </label>
              <input
                id="state"
                className="field"
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="postalCode">
                Código postal
              </label>
              <input
                id="postalCode"
                className="field"
                required
                value={form.postalCode}
                onChange={(e) =>
                  setForm({ ...form, postalCode: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label" htmlFor="country">
                País
              </label>
              <input
                id="country"
                className="field"
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="references">
              Referencias
            </label>
            <textarea
              id="references"
              className="field min-h-[80px]"
              value={form.references}
              onChange={(e) =>
                setForm({ ...form, references: e.target.value })
              }
            />
          </div>

          <fieldset>
            <legend className="label">Método de envío</legend>
            <div className="mt-2 space-y-3">
              {SHIPPING_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex cursor-pointer items-start gap-3 border p-4 transition ${
                    method === m.value
                      ? "border-berry bg-berry/5"
                      : "border-ink/10 hover:border-ink/25"
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    checked={method === m.value}
                    onChange={() =>
                      setMethod(m.value as "standard" | "express")
                    }
                    className="mt-1"
                  />
                  <span className="flex-1">
                    <span className="block font-medium">{m.label}</span>
                    <span className="text-sm text-ink-muted">{m.eta}</span>
                  </span>
                  <span className="font-medium">{formatPrice(m.cost)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p className="text-sm text-berry">{error}</p>}
          <button type="submit" className="btn-primary">
            Continuar al pago
          </button>
        </div>

        <aside className="h-fit border border-ink/10 bg-white/60 p-6">
          <h2 className="font-display text-xl">Totales</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd>{formatPrice(sub)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">IVA</dt>
              <dd>{formatPrice(tax)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Envío</dt>
              <dd>{formatPrice(shipping.cost)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-medium">
              <dt>Total estimado</dt>
              <dd>{formatPrice(sub + tax + shipping.cost)}</dd>
            </div>
          </dl>
        </aside>
      </form>
    </div>
  );
}
