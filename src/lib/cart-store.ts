import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  packageSize: string;
  quantity: number;
  stock: number;
};

type CatalogSnapshot = {
  id: string;
  name: string;
  price: number;
  image: string;
  packageSize: string;
  stock: number;
  active?: boolean;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  removeItems: (productIds: string[]) => void;
  setQuantity: (productId: string, quantity: number) => void;
  syncCatalog: (catalog: CatalogSnapshot[]) => void;
  clear: () => void;
};

function money(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Totales del carrito a partir de la lista visible. No usar get() del store. */
export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + money(item.price) * money(item.quantity), 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + money(item.quantity), 0);
}

function normalizeItem(item: CartItem): CartItem {
  if (!item || typeof item !== "object") {
    return {
      productId: "",
      name: "Producto",
      price: 0,
      image: "",
      packageSize: "",
      quantity: 1,
      stock: 0,
    };
  }
  const stock = Math.max(0, Math.floor(money(item.stock)));
  const quantity = Math.min(Math.max(1, Math.floor(money(item.quantity))), stock || 1);
  return {
    ...item,
    name: String(item?.name || "Producto"),
    image: typeof item?.image === "string" ? item.image : "",
    packageSize: String(item?.packageSize || ""),
    price: money(item.price),
    stock,
    quantity: stock > 0 ? Math.min(quantity, stock) : quantity,
  };
}

/** Evita que la rehidratación de localStorage pise un cambio que el usuario acaba de hacer. */
let mutatedBeforeHydration = false;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, qty = 1) => {
        mutatedBeforeHydration = true;
        const incoming = normalizeItem({ ...item, quantity: qty });
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? normalizeItem({
                      ...i,
                      ...incoming,
                      quantity: Math.min(i.quantity + qty, incoming.stock || i.stock),
                      stock: incoming.stock,
                    })
                  : i
              ),
            };
          }
          return {
            items: [...state.items, incoming],
          };
        });
      },
      removeItem: (productId) => {
        mutatedBeforeHydration = true;
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },
      removeItems: (productIds) => {
        mutatedBeforeHydration = true;
        set((state) => ({
          items: state.items.filter((i) => !productIds.includes(i.productId)),
        }));
      },
      setQuantity: (productId, quantity) => {
        mutatedBeforeHydration = true;
        if (!Number.isFinite(quantity)) return;
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId
                ? normalizeItem({ ...i, quantity })
                : i
            )
            .filter((i) => i.quantity > 0),
        }));
      },
      syncCatalog: (catalog) => {
        const byId = new Map(catalog.map((product) => [product.id, product]));
        set((state) => ({
          items: state.items.flatMap((item) => {
            const live = byId.get(item.productId);
            if (!live || live.active === false) return [];
            const stock = Math.max(0, Math.floor(money(live.stock)));
            if (stock < 1) return [];
            return [
              normalizeItem({
                ...item,
                name: live.name || item.name,
                price: money(live.price),
                image: live.image ?? item.image,
                packageSize: live.packageSize || item.packageSize,
                stock,
                quantity: Math.min(item.quantity, stock),
              }),
            ];
          }),
        }));
      },
      clear: () => {
        mutatedBeforeHydration = true;
        set({ items: [] });
      },
    }),
    {
      name: "mora-hueso-cart",
      partialize: (state) => ({ items: state.items }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as { items?: CartItem[] };
        const saved = Array.isArray(persisted.items)
          ? persisted.items
              .map(normalizeItem)
              .filter((item) => item.productId)
          : currentState.items;
        return {
          ...currentState,
          items: mutatedBeforeHydration ? currentState.items : saved,
        };
      },
    }
  )
);
