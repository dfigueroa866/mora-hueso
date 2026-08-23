"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/constants";

type CatalogProduct = {
  id: string;
  name: string;
  sku: string;
  active: boolean;
};

type SalesKpis = {
  productRevenue: number;
  unitsSold: number;
  orderCount: number;
  averageTicket: number;
  tax: number;
  discount: number;
  shipping: number;
  orderTotal: number;
};

type ProductSalesRow = {
  productId: string | null;
  name: string;
  sku: string;
  units: number;
  revenue: number;
  mixPercent: number;
  orderCount: number;
};

type SalesReport = {
  kpis: SalesKpis;
  byProduct: ProductSalesRow[];
};

type DatePreset = "today" | "7d" | "30d" | "month" | "year" | "all" | "custom";

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "month", label: "Este mes" },
  { id: "year", label: "Este año" },
  { id: "all", label: "Todo" },
  { id: "custom", label: "Personalizado" },
];

function mexicoTodayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(new Date());
}

function addDaysIso(iso: string, delta: number) {
  const next = new Date(
    new Date(`${iso}T12:00:00.000-06:00`).getTime() + delta * 24 * 60 * 60 * 1000
  );
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
  }).format(next);
}

function rangeForPreset(preset: DatePreset): { from: string; to: string } {
  const today = mexicoTodayIso();
  if (preset === "today") return { from: today, to: today };
  if (preset === "7d") return { from: addDaysIso(today, -6), to: today };
  if (preset === "30d") return { from: addDaysIso(today, -29), to: today };
  if (preset === "month") return { from: `${today.slice(0, 8)}01`, to: today };
  if (preset === "year") return { from: `${today.slice(0, 4)}-01-01`, to: today };
  return { from: "", to: "" };
}

function queryFromFilters(from: string, to: string, productId: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (productId) params.set("productId", productId);
  return params;
}

export function AdminSales({ products }: { products: CatalogProduct[] }) {
  const initial = rangeForPreset("month");
  const [preset, setPreset] = useState<DatePreset>("month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [productId, setProductId] = useState("");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<"detail" | "summary" | null>(
    null
  );

  const catalog = useMemo(
    () =>
      [...products].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      ),
    [products]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = queryFromFilters(from, to, productId);
      const res = await fetch(`/api/admin/sales?${params.toString()}`);
      if (res.status === 401) {
        setError("No autorizado");
        setReport(null);
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudieron cargar las ventas");
        setReport(null);
        return;
      }
      setReport(json as SalesReport);
    } catch {
      setError("No se pudieron cargar las ventas");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, productId]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyPreset(next: DatePreset) {
    setPreset(next);
    if (next === "custom") return;
    const range = rangeForPreset(next);
    setFrom(range.from);
    setTo(range.to);
  }

  async function download(kind: "detail" | "summary") {
    setDownloading(kind);
    setError("");
    try {
      const params = queryFromFilters(from, to, productId);
      params.set("kind", kind);
      const res = await fetch(`/api/admin/sales/export?${params.toString()}`);
      if (!res.ok) {
        setError("No se pudo descargar el reporte");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        kind === "summary"
          ? `ventas-productos-${mexicoTodayIso()}.csv`
          : `ventas-detalle-${mexicoTodayIso()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo descargar el reporte");
    } finally {
      setDownloading(null);
    }
  }

  const kpis = report?.kpis;
  const empty = !!report && report.byProduct.length === 0;

  return (
    <div className="space-y-6">
      <div className="border border-ink/10 bg-white/50 p-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition ${
                preset === p.id
                  ? "border-b-2 border-berry text-ink"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="sales-from">
              Desde
            </label>
            <input
              id="sales-from"
              type="date"
              className="field"
              value={from}
              onChange={(e) => {
                setPreset("custom");
                setFrom(e.target.value);
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="sales-to">
              Hasta
            </label>
            <input
              id="sales-to"
              type="date"
              className="field"
              value={to}
              onChange={(e) => {
                setPreset("custom");
                setTo(e.target.value);
              }}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="label" htmlFor="sales-product">
              Producto
            </label>
            <select
              id="sales-product"
              className="field"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Todos los productos</option>
              {catalog.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                  {!p.active ? " · inactivo" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-ghost"
            disabled={downloading !== null}
            onClick={() => void download("detail")}
          >
            {downloading === "detail"
              ? "Descargando…"
              : "Descargar detalle"}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={downloading !== null}
            onClick={() => void download("summary")}
          >
            {downloading === "summary"
              ? "Descargando…"
              : "Descargar por producto"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-sm border border-berry/30 bg-berry/10 px-3 py-2 text-sm text-berry">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-ink-muted">Cargando ventas…</p>
      )}

      {!loading && kpis && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Ingreso productos", formatPrice(kpis.productRevenue)],
              ["Unidades", kpis.unitsSold],
              ["Pedidos", kpis.orderCount],
              ["Ticket promedio", formatPrice(kpis.averageTicket)],
              ["IVA cobrado", formatPrice(kpis.tax)],
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
          </div>
          <p className="text-sm text-ink-muted">
            Descuentos {formatPrice(kpis.discount)} · Envío{" "}
            {formatPrice(kpis.shipping)} · Total cobrado{" "}
            {formatPrice(kpis.orderTotal)}
          </p>
        </>
      )}

      {!loading && empty && (
        <p className="text-ink-muted">No hay ventas en este periodo.</p>
      )}

      {!loading && report && report.byProduct.length > 0 && (
        <div className="overflow-hidden rounded-sm border border-ink/10 bg-white/70">
          <div className="border-b border-ink/10 bg-ink/[0.03] px-3 py-2">
            <h2 className="font-display text-xl">Ventas por producto</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.12em] text-ink-muted">
                  <th className="px-3 py-2 font-medium">Producto</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium text-right">Uds</th>
                  <th className="px-3 py-2 font-medium text-right">Ingreso</th>
                  <th className="px-3 py-2 font-medium text-right">Mix</th>
                  <th className="px-3 py-2 font-medium text-right">Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {report.byProduct.map((row) => (
                  <tr
                    key={`${row.sku}-${row.productId ?? "none"}`}
                    className="border-b border-ink/5"
                  >
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2 text-ink-muted">{row.sku}</td>
                    <td className="px-3 py-2 text-right">{row.units}</td>
                    <td className="px-3 py-2 text-right">
                      {formatPrice(row.revenue)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.mixPercent.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right">{row.orderCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
