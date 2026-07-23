"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatPrice, TAX_RATE, roundMoney } from "@/lib/constants";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { items, setQuantity, removeItem, removeItems, clear, subtotal } =
    useCart();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setSelected((prev) =>
      prev.filter((id) => items.some((i) => i.productId === id))
    );
  }, [items]);

  if (!mounted) {
    return <div className="section-pad text-ink-muted">Cargando carrito…</div>;
  }

  const sub = subtotal();
  const tax = roundMoney(sub * TAX_RATE);
  const allSelected = items.length > 0 && selected.length === items.length;

  function toggleOne(productId: string) {
    setSelected((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  function toggleAll() {
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(items.map((i) => i.productId));
    }
  }

  function deleteSelected() {
    if (selected.length === 0) return;
    removeItems(selected);
    setSelected([]);
  }

  function emptyCart() {
    if (!confirm("¿Vaciar todo el carrito?")) return;
    clear();
    setSelected([]);
  }

  if (items.length === 0) {
    return (
      <div className="section-pad text-center">
        <h1 className="font-display text-4xl font-semibold">Carrito</h1>
        <p className="mt-3 text-ink-muted">Tu carrito está vacío.</p>
        <Link href="/#catalogo" className="btn-primary mt-6 inline-flex">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="section-pad">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold">Carrito</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost"
            disabled={selected.length === 0}
            onClick={deleteSelected}
          >
            Eliminar seleccionados
            {selected.length > 0 ? ` (${selected.length})` : ""}
          </button>
          <button type="button" className="btn-ghost" onClick={emptyCart}>
            Vaciar carrito
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <label className="mb-4 flex cursor-pointer items-center gap-3 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 accent-berry"
            />
            Seleccionar todos
          </label>

          <ul className="space-y-6">
            {items.map((item) => {
              const isChecked = selected.includes(item.productId);
              return (
                <li
                  key={item.productId}
                  className="flex gap-3 border-b border-ink/10 pb-6 sm:gap-4"
                >
                  <label className="flex shrink-0 items-start pt-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOne(item.productId)}
                      className="h-4 w-4 accent-berry"
                      aria-label={`Seleccionar ${item.name}`}
                    />
                  </label>
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-bone-warm">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/productos/${item.productId}`}
                          className="font-display text-lg hover:text-berry"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-ink-muted">
                          {item.packageSize}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) =>
                          setQuantity(item.productId, Number(e.target.value))
                        }
                        className="field w-20"
                      />
                      <button
                        className="text-sm text-berry hover:underline"
                        onClick={() => removeItem(item.productId)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="h-fit border border-ink/10 bg-white/60 p-6">
          <h2 className="font-display text-xl">Resumen</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd>{formatPrice(sub)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">
                IVA estimado ({TAX_RATE * 100}%)
              </dt>
              <dd>{formatPrice(tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-medium">
              <dt>Antes de envío</dt>
              <dd>{formatPrice(sub + tax)}</dd>
            </div>
          </dl>
          <Link href="/envio" className="btn-primary mt-6 w-full">
            Continuar a envío
          </Link>
        </aside>
      </div>
    </div>
  );
}
