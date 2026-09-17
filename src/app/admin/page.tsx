"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CATEGORIES,
  formatPrice,
  categoryLabel,
} from "@/lib/constants";
import { orderStatusLabel } from "@/lib/order-status";
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
  mpPaymentId?: string | null;
  mpStatus?: string | null;
  mpStatusDetail?: string | null;
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
    "inventory" | "orders" | "sales" | "form" | "policies" | "alerts"
  >("inventory");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<string>("");
  const [blobSyncing, setBlobSyncing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    body: string;
    confirmLabel: string;
    busy?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);
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
    if (!confirmDialog || confirmDialog.busy) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setConfirmDialog(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmDialog]);

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
    const ids = [...selectedIds];
    const count = ids.length;
    setConfirmDialog({
      title: "Desactivar productos",
      body: `¿Desactivar ${count} producto${count === 1 ? "" : "s"}? Dejarán de mostrarse en la tienda.`,
      confirmLabel: "Desactivar",
      onConfirm: async () => {
        setBulkDeleting(true);
        setError("");
        try {
          const res = await fetch("/api/admin/products/bulk-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
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
      },
    });
  }

  async function deleteSelected() {
    if (!deleteArmed || selectedIds.length === 0) return;
    const ids = [...selectedIds];
    const count = ids.length;
    setConfirmDialog({
      title: "Eliminar productos",
      body: `¿Eliminar ${count} producto${count === 1 ? "" : "s"} de forma permanente? Los pedidos conservan el nombre, pero el producto ya no se podrá recuperar.`,
      confirmLabel: "Eliminar",
      onConfirm: async () => {
        setBulkDeleting(true);
        setError("");
        try {
          const res = await fetch("/api/admin/products/bulk-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, permanent: true }),
          });
          const json = await res.json();
          if (!res.ok) {
            setError(json.error || "No se pudieron eliminar");
            return;
          }
          setMsg(`${json.deleted} producto(s) eliminados`);
          setSelectedIds([]);
          await load();
        } catch {
          setError("Error al eliminar productos");
        } finally {
          setBulkDeleting(false);
        }
      },
    });
  }

  async function deleteOne(p: Product) {
    if (!deleteArmed) return;
    setConfirmDialog({
      title: "Eliminar producto",
      body: `¿Eliminar “${p.name}” de forma permanente? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      onConfirm: async () => {
        setError("");
        const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError(json.error || "No se pudo eliminar");
          return;
        }
        setMsg(`“${p.name}” eliminado`);
        setSelectedIds((prev) => prev.filter((id) => id !== p.id));
        await load();
      },
    });
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

  async function syncBlobImages() {
    setError("");
    setMsg("");
    setCsvResult("");
    setBlobSyncing(true);
    try {
      const res = await fetch("/api/admin/products/sync-images", {
        method: "POST",
      });
      const json = (await res.json()) as {
        error?: string;
        blobCount?: number;
        updated?: number;
        skipped?: number;
        unmatched?: { sku: string; name: string }[];
      };
      if (!res.ok) {
        setError(json.error || "No se pudieron vincular las imágenes de Blob");
        return;
      }
      setMsg(
        `Imágenes Blob: ${json.updated ?? 0} actualizadas, ${json.skipped ?? 0} ya estaban bien, ${json.unmatched?.length ?? 0} sin coincidencia (${json.blobCount ?? 0} archivos en Products/).`
      );
      if (json.unmatched?.length) {
        setCsvResult(
          json.unmatched
            .slice(0, 15)
            .map((u) => `${u.sku}: ${u.name}`)
            .join("\n")
        );
      }
      await load();
    } catch {
      setError("No se pudo vincular con Vercel Blob");
    } finally {
      setBlobSyncing(false);
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
          <button className="btn-primary w-full sm:w-auto" onClick={startCreate}>
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
            <p className="mt-2 font-display text-2xl md:text-3xl">{value}</p>
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
            className={`mt-2 font-display text-2xl md:text-3xl ${
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
            className={`mt-2 font-display text-2xl md:text-3xl ${
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
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2 border-b border-ink/10">
        {(
          [
            ["inventory", "Inventario"],
            ["orders", "Pedidos"],
            ["sales", "Ventas"],
            ["alerts", "Alertas"],
            ["policies", "Políticas"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`shrink-0 px-4 py-3 text-sm transition ${
              tab === key
                ? "border-b-2 border-berry text-ink"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
        </div>
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

      {tab === "orders" && (
        <div className="border border-ink/10 bg-white/60 p-5">
          <h2 className="font-display text-xl">Pedidos</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Historial de compras y el estado que regresó Mercado Pago.
          </p>
          {data.orders.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Aún no hay pedidos.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10 text-sm">
              {data.orders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium">{order.trackingNumber}</p>
                    <p className="text-ink-muted">
                      {order.billingName}
                      {order.billingEmail ? ` · ${order.billingEmail}` : ""} ·{" "}
                      {orderStatusLabel(order.status)}
                      {order.mpStatus ? ` · ${order.mpStatus}` : ""}
                      {order.mpPaymentId ? ` · MP ${order.mpPaymentId}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {new Date(order.createdAt).toLocaleString("es-MX")}
                      {order.items?.length
                        ? ` · ${order.items
                            .map((i) => `${i.name} ×${i.quantity}`)
                            .join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <p className="font-medium">{formatPrice(order.total)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "inventory" && (
        <div className="border border-ink/10 bg-white/60 p-5">
          <h2 className="font-display text-xl">Carga masiva (CSV)</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Acentos y eñes se conservan. Si editas en Excel, usa esta plantilla
            (UTF-8) o vuelve a subir el archivo después de guardar.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              className="btn-ghost w-full sm:w-auto"
              onClick={downloadCsvTemplate}
            >
              Descargar plantilla CSV
            </button>
            <label className="btn-primary w-full cursor-pointer sm:w-auto">
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
            <button
              type="button"
              className="btn-ghost w-full sm:w-auto"
              disabled={blobSyncing}
              onClick={() => void syncBlobImages()}
            >
              {blobSyncing ? "Vinculando…" : "Vincular imágenes Blob"}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Las fotos deben estar en Vercel Storage →{" "}
            <code className="text-[11px]">Products/</code>. El botón empareja
            cada producto con el JPG cuyo nombre se parece (p. ej.{" "}
            <code className="text-[11px]">Patitas de pollo…</code>). Requiere{" "}
            <code className="text-[11px]">BLOB_READ_WRITE_TOKEN</code> en el
            entorno.
          </p>
          {csvResult && (
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-sm bg-berry/5 p-3 text-xs text-berry">
              {csvResult}
            </pre>
          )}
        </div>
      )}

      {tab === "inventory" && (
        <div className="overflow-hidden rounded-sm border border-ink/10 bg-white/70">
          <div className="flex flex-col gap-2 border-b border-ink/10 bg-ink/[0.03] px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-xs text-ink-muted">
              {data.products.length} registro
              {data.products.length === 1 ? "" : "s"}
              {selectedIds.length > 0
                ? ` · ${selectedIds.length} seleccionado${selectedIds.length === 1 ? "" : "s"}`
                : ""}
              {deleteArmed ? " · eliminar activado" : ""}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className={`btn-ghost w-full px-3 py-1.5 text-xs sm:w-auto ${
                  deleteArmed ? "border-berry text-berry" : ""
                }`}
                onClick={() => {
                  setDeleteArmed((on) => !on);
                  if (deleteArmed) setSelectedIds([]);
                }}
              >
                {deleteArmed ? "Desactivar eliminar" : "Activar eliminar"}
              </button>
              <button
                type="button"
                className="btn-ghost w-full px-3 py-1.5 text-xs disabled:opacity-40 sm:w-auto"
                disabled={selectedIds.length === 0 || bulkDeleting}
                onClick={removeSelected}
              >
                {bulkDeleting
                  ? "Procesando…"
                  : `Desactivar seleccionados${selectedIds.length ? ` (${selectedIds.length})` : ""}`}
              </button>
              {deleteArmed && (
                <button
                  type="button"
                  className="w-full bg-berry px-3 py-1.5 text-xs text-white disabled:opacity-40 sm:w-auto"
                  disabled={selectedIds.length === 0 || bulkDeleting}
                  onClick={deleteSelected}
                >
                  {bulkDeleting
                    ? "Eliminando…"
                    : `Eliminar seleccionados${selectedIds.length ? ` (${selectedIds.length})` : ""}`}
                </button>
              )}
            </div>
          </div>

          <ul className="divide-y divide-ink/10 md:hidden">
            {data.products.map((p) => {
              const checked = selectedIds.includes(p.id);
              return (
                <li
                  key={p.id}
                  className={`p-4 ${!p.active ? "opacity-45" : ""} ${
                    checked ? "bg-berry/[0.04]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-berry"
                      disabled={!p.active && !deleteArmed}
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
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug text-ink">
                        {p.name}
                      </p>
                      {!p.active ? (
                        <span className="mt-0.5 inline-block text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                          Inactivo
                        </span>
                      ) : p.stock <= 0 ? (
                        <span className="mt-0.5 inline-block text-[10px] font-medium uppercase tracking-wide text-berry">
                          No disponible
                        </span>
                      ) : null}
                      <p className="mt-1 font-mono text-xs text-ink-muted">
                        {p.sku}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {categoryLabel(p.category)}
                      </p>
                      <p className="mt-1 font-medium tabular-nums">
                        {formatPrice(p.price)}
                      </p>
                      {p.supplier ? (
                        <p className="truncate text-sm text-ink-muted">
                          {p.supplier}
                        </p>
                      ) : null}
                      <label className="mt-3 block">
                        <span className="label">Stock</span>
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          className="field h-10 w-full tabular-nums"
                          defaultValue={p.stock}
                          key={`stock-m-${p.id}-${p.stock}`}
                          onBlur={(e) => {
                            const next = Number(e.target.value);
                            if (!Number.isFinite(next) || next === p.stock) return;
                            updateStock(p.id, next);
                          }}
                        />
                      </label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-ghost px-3 py-2 text-xs"
                          onClick={() => startEdit(p)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-ghost px-3 py-2 text-xs"
                          onClick={() => toggleActive(p)}
                        >
                          {p.active ? "Desactivar" : "Activar"}
                        </button>
                        {deleteArmed && (
                          <button
                            type="button"
                            className="btn-ghost px-3 py-2 text-xs text-berry"
                            onClick={() => deleteOne(p)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-ink/10 bg-bone-warm/60 text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                  <th className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-berry"
                      checked={
                        data.products.length > 0 &&
                        data.products
                          .filter((p) => deleteArmed || p.active)
                          .every((p) => selectedIds.includes(p.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(
                            data.products
                              .filter((p) => deleteArmed || p.active)
                              .map((p) => p.id)
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
                          disabled={!p.active && !deleteArmed}
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
                          key={`stock-d-${p.id}-${p.stock}`}
                          onBlur={(e) => {
                            const next = Number(e.target.value);
                            if (!Number.isFinite(next) || next === p.stock) return;
                            updateStock(p.id, next);
                          }}
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
                        {deleteArmed && (
                          <>
                            <span className="mx-1.5 text-ink/20">|</span>
                            <button
                              type="button"
                              className="text-[12px] font-medium text-berry hover:underline"
                              onClick={() => deleteOne(p)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
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
              <ul className="divide-y divide-ink/10 md:hidden">
                {data.lowStockAlerts.map((p) => (
                  <li key={p.id} className="p-4">
                    <p className="font-medium leading-snug text-ink">{p.name}</p>
                    <p className="mt-1 font-mono text-xs text-ink-muted">
                      {p.sku}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {categoryLabel(p.category)}
                    </p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                          Stock
                        </dt>
                        <dd className="mt-0.5 font-medium tabular-nums">
                          {p.stock}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                          Alerta en
                        </dt>
                        <dd className="mt-0.5 tabular-nums text-ink-muted">
                          {p.lowStockAt}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-2 font-medium text-berry">
                      {p.stock <= 0 ? "Agotado" : `${p.stock} uds`}
                    </p>
                    <button
                      type="button"
                      className="btn-ghost mt-3 w-full px-3 py-2 text-xs"
                      onClick={() => startEdit(p)}
                    >
                      Editar
                    </button>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
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
          className="grid w-full min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
            <p className="mt-1 text-xs text-ink-muted">
              Preferible: URL de Vercel Blob (
              <code className="text-[11px]">
                https://….public.blob.vercel-storage.com/Products/…
              </code>
              ) o usa el botón “Vincular imágenes Blob”. También sirve{" "}
              <code className="text-[11px]">/products/archivo.jpg</code>.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row lg:col-span-3">
            <button type="submit" className="btn-primary w-full sm:w-auto">
              {editingId ? "Actualizar" : "Crear producto"}
            </button>
            <button
              type="button"
              className="btn-ghost w-full sm:w-auto"
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
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-confirm-title"
          onClick={() => {
            if (!confirmDialog.busy) setConfirmDialog(null);
          }}
        >
          <div
            className="w-full max-w-md border border-ink/10 bg-bone p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="admin-confirm-title"
              className="font-display text-2xl font-semibold text-ink"
            >
              {confirmDialog.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {confirmDialog.body}
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="btn-ghost"
                disabled={confirmDialog.busy}
                onClick={() => setConfirmDialog(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={confirmDialog.busy}
                onClick={() => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog((current) =>
                    current ? { ...current, busy: true } : current
                  );
                  void action().finally(() => setConfirmDialog(null));
                }}
              >
                {confirmDialog.busy ? "Procesando…" : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
