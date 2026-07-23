"use client";

import { useMemo, useState } from "react";
import { ProductCard, ProductCardData } from "./ProductCard";
import { CATEGORIES, DOG_SIZES } from "@/lib/constants";

type Props = {
  products: ProductCardData[];
};

export function CatalogFilters({ products }: Props) {
  const [category, setCategory] = useState("");
  const [dogSize, setDogSize] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const list = useMemo(() => {
    return (
      products as Array<
        ProductCardData & { dogSize: string; ingredients: string }
      >
    ).filter((p) => {
      if (category && p.category !== category) return false;
      if (dogSize && dogSize !== "todos") {
        if (p.dogSize !== dogSize && p.dogSize !== "todos") return false;
      }
      if (ingredient.trim()) {
        if (
          !p.ingredients
            .toLowerCase()
            .includes(ingredient.trim().toLowerCase())
        )
          return false;
      }
      if (minPrice && p.price < Number(minPrice)) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      return true;
    });
  }, [products, category, dogSize, ingredient, minPrice, maxPrice]);

  return (
    <div>
      <div className="mb-8 grid gap-3 rounded-sm border border-ink/10 bg-white/50 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="label">Categoría</label>
          <select
            className="field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tamaño de perro</label>
          <select
            className="field"
            value={dogSize}
            onChange={(e) => setDogSize(e.target.value)}
          >
            <option value="">Cualquiera</option>
            {DOG_SIZES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Precio mín.</label>
          <input
            className="field"
            type="number"
            min={0}
            placeholder="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Precio máx.</label>
          <input
            className="field"
            type="number"
            min={0}
            placeholder="500"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Ingrediente</label>
          <input
            className="field"
            placeholder="ej. pollo, avena"
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
          />
        </div>
      </div>

      <p className="mb-6 text-sm text-ink-muted">
        {list.length} producto{list.length === 1 ? "" : "s"}
      </p>

      {list.length === 0 ? (
        <p className="py-16 text-center text-ink-muted">
          No hay productos con esos filtros.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
