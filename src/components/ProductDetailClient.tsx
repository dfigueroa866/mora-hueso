"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import {
  formatPrice,
  categoryLabel,
  isAvailable,
} from "@/lib/constants";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  packageSize: string;
  ingredients: string;
  nutrition: string;
  image: string;
  sku: string;
};

export function ProductDetailClient({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();
  const available = isAvailable(product.stock);
  const nutrition = (() => {
    try {
      const parsed = JSON.parse(product.nutrition) as Record<string, string>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {} as Record<string, string>;
    }
  })();

  function addToCart() {
    if (!available) return;
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        packageSize: product.packageSize,
        stock: product.stock,
      },
      qty
    );
    setMsg("Agregado al carrito");
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <div
        className="relative min-h-[360px] animate-scale-in bg-bone-warm bg-cover bg-center lg:min-h-[560px]"
        style={{ backgroundImage: `url(${product.image})` }}
        role="img"
        aria-label={product.name}
      />

      <div className="animate-fade-up">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">
          {categoryLabel(product.category)} · {product.packageSize}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
          {product.name}
        </h1>
        <p className="mt-4 text-2xl font-medium text-berry">
          {formatPrice(product.price)}
        </p>

        <p className="mt-5 text-base leading-relaxed text-ink-muted">
          {product.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="border border-ink/15 px-3 py-1.5">
            SKU: {product.sku}
          </span>
          <span
            className={
              available
                ? "border border-sage/40 bg-sage/10 px-3 py-1.5 text-sage"
                : "border border-berry/40 bg-berry/10 px-3 py-1.5 text-berry"
            }
          >
            {available
              ? `${product.stock} en stock`
              : "No disponible"}
          </span>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="qty">
            Cantidad
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={Math.max(product.stock, 1)}
            value={qty}
            disabled={!available}
            onChange={(e) => setQty(Number(e.target.value))}
            className="field w-20"
          />
          <button
            className="btn-primary"
            disabled={!available}
            onClick={addToCart}
          >
            Agregar al carrito
          </button>
          <button
            className="btn-ghost"
            disabled={!available}
            onClick={() => {
              addToCart();
              router.push("/carrito");
            }}
          >
            Comprar ahora
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-sage">{msg}</p>}

        <div className="mt-10 border-t border-ink/10 pt-8">
          <h2 className="font-display text-xl">Ingredientes</h2>
          <p className="mt-2 text-sm capitalize text-ink-muted">
            {product.ingredients}
          </p>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-xl">Tabla nutricional</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {Object.entries(nutrition).map(([k, v]) => (
                <tr key={k} className="border-b border-ink/10">
                  <td className="py-2 capitalize text-ink-muted">{k}</td>
                  <td className="py-2 text-right font-medium">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
