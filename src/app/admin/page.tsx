"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CATEGORIES,
  formatPrice,
  categoryLabel,
} from "@/lib/constants";
import { AdminPolicies } from "@/components/AdminPolicies";
import { AdminSales } from "@/components/AdminSales";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sku: string;
  supplier: string;
  packageSize: string;
  ingredients: string;
  nutrition: string;
  image: string;
  lowStockAt: number;
  active: boolean;
};

type Order = {
  id: string;
  trackingNumber: string;
  total: number;
  status: string;
  createdAt: string;
  billingName: string;
  billingEmail: string;
  user?: { name: string; email: string } | null;
  items: { name: string; quantity: number; price: number }[];
};

type Dashboard = {
  products: Product[];
  orders: Order[];
  lowStockAlerts: Product[];
  stats: {
    productCount: number;
    inactiveCount: number;
    orderCount: number;
    revenue: number;
    lowStockCount: number;
  };
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nombre",
  description: "Descripción",
  price: "Precio",
  category: "Categoría",
  stock: "Stock",
  sku: "SKU",
  supplier: "Proveedor",
  packageSize: "Empaque",
  ingredients: "Ingredientes",
  nutrition: "Nutrición",
  image: "Imagen",
  lowStockAt: "Alerta de stock",
  active: "Estado",
};

function formatSaveError(json: {
  error?: string;
  details?: {
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
}) {
  const parts: string[] = [];
  const fieldErrors = json.details?.fieldErrors || {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (!messages?.length) continue;
    const label = FIELD_LABELS[key] || key;
    parts.push(`${label}: ${messages.join(" ")}`);
  }
  if (json.details?.formErrors?.length) {
    parts.push(...json.details.formErrors);
  }
  if (parts.length) return parts.join(" · ");
  return json.error || "Error al guardar";
}

const emptyForm = {
  name: "",
  description: "",
  price: 99,
  category: "naturales",
  stock: 10,
  sku: "",
  supplier: "",
  packageSize: "100 g",
  ingredients: "",
  nutrition: '{"protein":"10%","fat":"5%","fiber":"3%","moisture":"10%","ash":"4%"}',
  image:
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
  lowStockAt: 10,
  active: true,
};

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [tab, setTab] = useState<
    "inventory" | "sales" | "form" | "policies" | "alerts"
  >("inventory");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const openedEdit = useRef(false);
  const openedVista = useRef(false);

  async function load() {
    const res = await fetch("/api/admin/dashboard");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.products.map((p) => p.id));
    setSelectedIds((prev) => prev.filter((id) => ids.has(id)));
  }, [data]);

  useEffect(() => {
    if (openedVista.current) return;
    const vista = new URLSearchParams(window.location.search).get("vista");
    if (vista !== "alertas") return;
    openedVista.current = true;
    setTab("alerts");
  }, []);

  useEffect(() => {
    if (!data || openedEdit.current) return;
    const id = new URLSearchParams(window.location.search).get("editar");
    if (!id) return;
    const product = data.products.find((p) => p.id === id);
    if (!product) return;
    openedEdit.current = true;
    startEdit(product);
  }, [data]);

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      stock: p.stock,
      sku: p.sku,
      supplier: p.supplier,
      packageSize: p.packageSize,
      ingredients: p.ingredients,
      nutrition: p.nutrition,
      image: p.image,
      lowStockAt: p.lowStockAt,
      active: p.active,
    });
    setTab("form");
  }

  function startCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sku: `MH-${Date.now().toString().slice(-6)}`,
    });
    setTab("form");
  }

  async function saveProduct(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      lowStockAt: Number(form.lowStockAt),
    };
    const res = await fetch(
      editingId ? `/api/products/${editingId}` : "/api/products",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      setError(formatSaveError(json));
      return;
    }
    setMsg(editingId ? "Producto actualizado" : "Producto creado");
    setEditingId(null);
    setForm(emptyForm);
    setTab("inventory");
    load();
  }

  async function updateStock(id: string, stock: number) {
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock }),
    });
    load();
  }

  async function toggleActive(p: Product) {
    setError("");
    const next = !p.active;
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "No se pudo cambiar el estado");
      return;
    }
    setMsg(next ? `"${p.name}" activado` : `"${p.name}" desactivado`);
    if (!next) {
      setSelectedIds((prev) => prev.filter((x) => x !== p.id));
    }
    await load();
  }

  async function removeSelected() {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `¿Desactivar ${selectedIds.length} producto${selectedIds.length === 1 ? "" : "s"}? Dejarán de mostrarse en la tienda.`
      )
    ) {
      return;
    }
    setBulkDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudieron desactivar");
        return;
      }
      setMsg(`${json.deleted} producto(s) desactivados`);
      setSelectedIds([]);
      await load();
    } catch {
      setError("Error al desactivar productos");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function downloadCsvTemplate() {
    setError("");
    const res = await fetch("/api/admin/products/template");
    if (!res.ok) {
      setError("No se pudo descargar la plantilla");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-productos-mora-hueso.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onCsvUpload(file: File | null) {
    if (!file) return;
    setError("");
    setMsg("");
    setCsvResult("");
    setCsvUploading(true);
    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Selecciona un archivo con extensión .csv");
        return;
      }
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body,
      });
      let json: {
        error?: string;
        created?: number;
        updated?: number;
        failed?: number;
        errors?: { row: number; sku?: string; error: string }[];
      } = {};
      try {
        json = await res.json();
      } catch {
        setError(
          res.ok
            ? "Respuesta inválida del servidor"
            : `Error del servidor (${res.status}). Intenta de nuevo.`
        );
        return;
      }
      if (!res.ok) {
        setError(json.error || `Error al importar CSV (${res.status})`);
        return;
      }
      setMsg(
        `Carga masiva: ${json.created ?? 0} creados, ${json.updated ?? 0} actualizados, ${json.failed ?? 0} con error.`
      );
      if (json.errors?.length) {
        setCsvResult(
          json.errors
            .slice(0, 10)
            .map(
              (e) =>
                `Fila ${e.row}${e.sku ? ` (${e.sku})` : ""}: ${e.error}`
            )
            .join("\n")
        );
      } else {
        setCsvResult("");
      }
      await load();
    } catch {
      setError("No se pudo subir el archivo. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setCsvUploading(false);
    }
  }

  if (loading) {
    return <div className="section-pad text-ink-muted">Cargando admin…</div>;
  }

  if (!data) {
    return (
      <div className="section-pad text-center">
        <p>Acceso solo para administradores.</p>
        <Link href="/login" className="btn-primary mt-4 inline-flex">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="section-pad space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold">
            {tab === "form"
              ? editingId
                ? "Editar producto"
                : "Nuevo producto"
              : "Administración"}
          </h1>
          <p className="mt-2 text-ink-muted">
            {tab === "form"
              ? "Completa los datos del producto. Cancelar vuelve al inventario."
              : "Inventario, alertas de stock e historial de ventas."}
          </p>
        </div>
        {tab !== "form" && (
          <button className="btn-primary" onClick={startCreate}>
            Nuevo producto
          </button>
        )}
      </div>

      {tab !== "form" && (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Productos activos", data.stats.productCount],
          ["Inactivos", data.stats.inactiveCount ?? 0],
          ["Pedidos", data.stats.orderCount],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="border border-ink/10 bg-white/60 px-4 py-5"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">
              {label}
            </p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTab("sales")}
          className={`border px-4 py-5 text-left transition ${
            tab === "sales"
              ? "border-sage/35 bg-sage/10"
              : "border-ink/10 bg-white/60 hover:border-sage/30 hover:bg-sage/5"
          }`}
        >
          <p
            className={`text-xs uppercase tracking-[0.14em] ${
              tab === "sales" ? "text-sage" : "text-ink-muted"
            }`}
          >
            Ingresos
          </p>
          <p
            className={`mt-2 font-display text-3xl ${
              tab === "sales" ? "text-sage" : ""
            }`}
          >
            {formatPrice(data.stats.revenue)}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setTab("alerts")}
          className={`border px-4 py-5 text-left transition ${
            tab === "alerts"
              ? "border-berry/40 bg-berry/10"
              : data.stats.lowStockCount > 0
                ? "border-berry/25 bg-berry/5 hover:border-berry/40 hover:bg-berry/10"
                : "border-ink/10 bg-white/60 hover:border-berry/30 hover:bg-berry/5"
          }`}
        >
          <p
            className={`text-xs uppercase tracking-[0.14em] ${
              tab === "alerts" || data.stats.lowStockCount > 0
                ? "text-berry"
                : "text-ink-muted"
            }`}
          >
            Alertas stock
          </p>
          <p
            className={`mt-2 font-display text-3xl ${
              tab === "alerts" || data.stats.lowStockCount > 0
                ? "text-berry"
                : ""
            }`}
          >
            {data.stats.lowStockCount}
          </p>
        </button>
      </div>
      )}

      {tab !== "form" && (
      <div className="flex gap-2 border-b border-ink/10">
        {(
          [
            ["inventory", "Inventario"],
            ["sales", "Ventas"],
            ["alerts", "Alertas"],
            ["policies", "Políticas"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm transition ${
              tab === key
                ? "border-b-2 border-berry text-ink"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      )}

      {msg && (
        <p className="rounded-sm border border-sage/30 bg-sage/10 px-3 py-2 text-sm text-sage">
          {msg}
        </p>
      )}
      {error && (
        <p className="rounded-sm border border-berry/30 bg-berry/10 px-3 py-2 text-sm text-berry">
          {error}
        </p>
      )}

      {tab === "inventory" && (
        <div className="border border-ink/10 bg-white/60 p-5">
          <h2 className="font-display text-xl">Carga masiva (CSV)</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-ghost"
              onClick={downloadCsvTemplate}
            >
              Descargar plantilla CSV
            </button>
            <label className="btn-primary cursor-pointer">
              {csvUploading ? "Subiendo…" : "Subir CSV"}
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={csvUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  e.target.value = "";
                  onCsvUpload(file);
                }}
              />
            </label>
          </div>
          {csvResult && (
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-sm bg-berry/5 p-3 text-xs text-berry">
              {csvResult}
            </pre>
          )}
        </div>
      )}

      {tab === "inventory" && (
        <div className="overflow-hidden rounded-sm border border-ink/10 bg-white/70">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 bg-ink/[0.03] px-3 py-2">
            <p className="text-xs text-ink-muted">
              {data.products.length} registro
              {data.products.length === 1 ? "" : "s"}
              {selectedIds.length > 0
                ? ` · ${selectedIds.length} seleccionado${selectedIds.length === 1 ? "" : "s"}`
                : ""}
            </p>
            <button
              type="button"
              className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
              disabled={selectedIds.length === 0 || bulkDeleting}
              onClick={removeSelected}
            >
              {bulkDeleting
                ? "Desactivando…"
                : `Desactivar seleccionados${selectedIds.length ? ` (${selectedIds.length})` : ""}`}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-ink/10 bg-bone-warm/60 text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-berry"
                      checked={
                        data.products.filter((p) => p.active).length > 0 &&
                        data.products
                          .filter((p) => p.active)
                          .every((p) => selectedIds.includes(p.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(
                            data.products.filter((p) => p.active).map((p) => p.id)
                          );
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      aria-label="Seleccionar todos"
                    />
                  </th>
                  <th className="px-2 py-2 font-medium">Producto</th>
                  <th className="px-2 py-2 font-medium">SKU</th>
                  <th className="px-2 py-2 font-medium">Categoría</th>
                  <th className="px-2 py-2 text-right font-medium">Precio</th>
                  <th className="px-2 py-2 font-medium">Stock</th>
                  <th className="px-2 py-2 font-medium">Proveedor</th>
                  <th className="px-3 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((p) => {
                  const checked = selectedIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-ink/[0.06] transition hover:bg-ink/[0.02] ${
                        !p.active ? "opacity-45" : ""
                      } ${checked ? "bg-berry/[0.04]" : ""}`}
                    >
                      <td className="px-3 py-1.5 align-middle">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-berry"
                          disabled={!p.active}
                          checked={checked}
                          onChange={() => {
                            setSelectedIds((prev) =>
                              prev.includes(p.id)
                                ? prev.filter((id) => id !== p.id)
                                : [...prev, p.id]
                            );
                          }}
                          aria-label={`Seleccionar ${p.name}`}
                        />
                      </td>
                      <td className="max-w-[220px] px-2 py-1.5 align-middle">
                        <span className="font-medium leading-snug text-ink">
                          {p.name}
                        </span>
                        {!p.active ? (
                          <span className="ml-1.5 inline-block whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                            Inactivo
                          </span>
                        ) : p.stock <= 0 ? (
                          <span className="ml-1.5 inline-block whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-berry">
                            No disponible
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 align-middle font-mono text-[12px] text-ink-muted">
                        {p.sku}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 align-middle text-ink-muted">
                        {categoryLabel(p.category)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right align-middle tabular-nums">
                        {formatPrice(p.price)}
                      </td>
                      <td className="px-2 py-1.5 align-middle">
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          className="field h-8 w-24 px-2 py-0 text-[13px] tabular-nums"
                          defaultValue={p.stock}
                          key={`${p.id}-${p.stock}`}
                          onBlur={(e) =>
                            updateStock(p.id, Number(e.target.value))
                          }
                        />
                      </td>
                      <td className="max-w-[140px] truncate px-2 py-1.5 align-middle text-ink-muted">
                        {p.supplier}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-right align-middle">
                        <button
                          type="button"
                          className="text-[12px] font-medium text-berry hover:underline"
                          onClick={() => startEdit(p)}
                        >
                          Editar
                        </button>
                        <span className="mx-1.5 text-ink/20">|</span>
                        <button
                          type="button"
                          className={`text-[12px] font-medium hover:underline ${
                            p.active
                              ? "text-ink-muted hover:text-berry"
                              : "text-sage hover:text-sage"
                          }`}
                          onClick={() => toggleActive(p)}
                        >
                          {p.active ? "Desactivar" : "Activar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "sales" && <AdminSales products={data.products} />}

      {tab === "alerts" && (
        <div className="space-y-6">
          {data.lowStockAlerts.length === 0 ? (
            <p className="text-ink-muted">No hay productos con stock bajo.</p>
          ) : (
            <div className="overflow-hidden rounded-sm border border-ink/10 bg-white/70">
              <div className="border-b border-ink/10 bg-ink/[0.03] px-3 py-2">
                <h2 className="font-display text-xl">Alertas de stock</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.12em] text-ink-muted">
                      <th className="px-3 py-2 font-medium">Producto</th>
                      <th className="px-3 py-2 font-medium">SKU</th>
                      <th className="px-3 py-2 font-medium">Categoría</th>
                      <th className="px-3 py-2 font-medium text-right">Stock</th>
                      <th className="px-3 py-2 font-medium text-right">
                        Alerta en
                      </th>
                      <th className="px-3 py-2 font-medium text-right">
                        Estado
                      </th>
                      <th className="px-3 py-2 font-medium text-right"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lowStockAlerts.map((p) => (
                      <tr key={p.id} className="border-b border-ink/5">
                        <td className="px-3 py-3 font-medium">{p.name}</td>
                        <td className="px-3 py-3 font-mono text-xs text-ink-muted">
                          {p.sku}
                        </td>
                        <td className="px-3 py-3 text-ink-muted">
                          {categoryLabel(p.category)}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {p.stock}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-ink-muted">
                          {p.lowStockAt}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-berry">
                          {p.stock <= 0 ? "Agotado" : `${p.stock} uds`}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            className="text-xs font-medium text-berry hover:underline"
                            onClick={() => startEdit(p)}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "policies" && <AdminPolicies />}

      {tab === "form" && (
        <form
          onSubmit={saveProduct}
          className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">Nombre</label>
            <input
              className="field"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">Descripción</label>
            <textarea
              className="field min-h-[90px]"
              required
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Precio</label>
            <input
              type="number"
              step="0.01"
              className="field"
              required
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="label">Stock</label>
            <input
              type="number"
              className="field"
              required
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="label">SKU</label>
            <input
              className="field"
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              disabled={!!editingId}
            />
          </div>
          <div>
            <label className="label">Proveedor</label>
            <input
              className="field"
              required
              value={form.supplier}
              onChange={(e) =>
                setForm({ ...form, supplier: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              className="field"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Empaque</label>
            <input
              className="field"
              required
              value={form.packageSize}
              onChange={(e) =>
                setForm({ ...form, packageSize: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Alerta stock bajo</label>
            <input
              type="number"
              className="field"
              value={form.lowStockAt}
              onChange={(e) =>
                setForm({ ...form, lowStockAt: Number(e.target.value) })
              }
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">Ingredientes</label>
            <input
              className="field"
              required
              value={form.ingredients}
              onChange={(e) =>
                setForm({ ...form, ingredients: e.target.value })
              }
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">Nutrición (JSON)</label>
            <textarea
              className="field min-h-[70px] font-mono text-xs"
              required
              value={form.nutrition}
              onChange={(e) =>
                setForm({ ...form, nutrition: e.target.value })
              }
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="label">URL de imagen</label>
            <input
              className="field"
              required
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
            <button type="submit" className="btn-primary">
              {editingId ? "Actualizar" : "Crear producto"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditingId(null);
                setTab("inventory");
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
