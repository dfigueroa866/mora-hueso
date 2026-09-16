import { Prisma } from "@prisma-client";
import { prisma } from "@/lib/db";
import { roundMoney } from "@/lib/constants";
import { escapeCsvField } from "@/lib/csv-products";
import { orderStatusLabel } from "@/lib/order-status";

export const SALES_STATUSES = ["paid", "shipped", "confirmed"] as const;
const MEXICO_TZ = "America/Mexico_City";
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export type SalesFilters = {
  from: string | null;
  to: string | null;
  productId: string | null;
};

export type SalesKpis = {
  productRevenue: number;
  unitsSold: number;
  orderCount: number;
  averageTicket: number;
  tax: number;
  discount: number;
  shipping: number;
  orderTotal: number;
};

export type ProductSalesRow = {
  productId: string | null;
  name: string;
  sku: string;
  units: number;
  revenue: number;
  mixPercent: number;
  orderCount: number;
};

export type SalesPoint = {
  key: string;
  label: string;
  revenue: number;
  units: number;
  orderCount: number;
};

export type SalesReport = {
  kpis: SalesKpis;
  byProduct: ProductSalesRow[];
  series: SalesPoint[];
  seriesGrain: "day" | "week" | "month";
};

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
    user: { select: { name: true; email: true } };
  };
}>;

function parseIsoDay(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? "";
  if (!ISO_DAY.test(raw)) return null;
  const parsed = new Date(`${raw}T12:00:00-06:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return raw;
}

export function parseSalesFilters(searchParams: URLSearchParams): SalesFilters {
  let from = parseIsoDay(searchParams.get("from"));
  let to = parseIsoDay(searchParams.get("to"));
  if (from && to && from > to) {
    const swap = from;
    from = to;
    to = swap;
  }
  const productId = searchParams.get("productId")?.trim() || null;
  return { from, to, productId };
}

function mexicoDayStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000-06:00`);
}

function mexicoDayEnd(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999-06:00`);
}

export function saleInstant(order: { paidAt: Date | null; createdAt: Date }): Date {
  return order.paidAt ?? order.createdAt;
}

export function formatMexicoDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatMexicoDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function csvLine(fields: Array<string | number>): string {
  return fields.map((f) => escapeCsvField(String(f))).join(",");
}

function moneyCsv(n: number): string {
  return roundMoney(n).toFixed(2);
}

function itemMatches(
  item: { productId: string | null; sku: string },
  productId: string | null,
  sku: string | null
) {
  if (!productId) return true;
  if (item.productId === productId) return true;
  if (sku && item.sku === sku) return true;
  return false;
}

async function productSkuFor(productId: string | null): Promise<string | null> {
  if (!productId) return null;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sku: true },
  });
  return product?.sku ?? null;
}

function buildOrderWhere(
  filters: SalesFilters,
  sku: string | null
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {
    status: { in: [...SALES_STATUSES] },
  };

  const from = filters.from ? mexicoDayStart(filters.from) : null;
  const to = filters.to ? mexicoDayEnd(filters.to) : null;

  if (from || to) {
    const paidRange: Prisma.DateTimeFilter = {};
    const createdRange: Prisma.DateTimeFilter = {};
    if (from) {
      paidRange.gte = from;
      createdRange.gte = from;
    }
    if (to) {
      paidRange.lte = to;
      createdRange.lte = to;
    }
    where.AND = [
      {
        OR: [
          { paidAt: paidRange },
          { AND: [{ paidAt: null }, { createdAt: createdRange }] },
        ],
      },
    ];
  }

  if (filters.productId) {
    const itemOr: Prisma.OrderItemWhereInput[] = [
      { productId: filters.productId },
    ];
    if (sku) itemOr.push({ sku });
    where.items = { some: { OR: itemOr } };
  }

  return where;
}

async function loadSalesOrders(filters: SalesFilters): Promise<{
  orders: OrderWithItems[];
  sku: string | null;
}> {
  const sku = await productSkuFor(filters.productId);
  const orders = await prisma.order.findMany({
    where: buildOrderWhere(filters, sku),
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
  });
  orders.sort(
    (a, b) => saleInstant(b).getTime() - saleInstant(a).getTime()
  );
  return { orders, sku };
}

function addDaysIso(iso: string, delta: number): string {
  const next = new Date(
    new Date(`${iso}T12:00:00.000-06:00`).getTime() + delta * 24 * 60 * 60 * 1000
  );
  return formatMexicoDate(next);
}

function daysInclusive(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00.000-06:00`).getTime();
  const b = new Date(`${to}T12:00:00.000-06:00`).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

function mondayOf(iso: string): string {
  const date = new Date(`${iso}T12:00:00.000-06:00`);
  const dow = date.getUTCDay();
  const back = (dow + 6) % 7;
  return addDaysIso(iso, -back);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function formatDayLabel(iso: string): string {
  const parts = iso.split("-");
  return `${parts[2]}/${parts[1]}`;
}

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  const names = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const idx = Number(month) - 1;
  return `${names[idx] ?? month} ${year.slice(2)}`;
}

function buildSeries(
  orders: OrderWithItems[],
  productId: string | null,
  sku: string | null,
  from: string | null,
  to: string | null
): { series: SalesPoint[]; seriesGrain: "day" | "week" | "month" } {
  const perDay = new Map<
    string,
    { revenue: number; units: number; orderIds: Set<string> }
  >();

  for (const order of orders) {
    const day = formatMexicoDate(saleInstant(order));
    const matchingItems = order.items.filter((item) =>
      itemMatches(item, productId, sku)
    );
    if (matchingItems.length === 0) continue;
    let revenue = 0;
    let units = 0;
    for (const item of matchingItems) {
      revenue += item.price * item.quantity;
      units += item.quantity;
    }
    const prev = perDay.get(day);
    if (prev) {
      prev.revenue = roundMoney(prev.revenue + revenue);
      prev.units += units;
      prev.orderIds.add(order.id);
    } else {
      perDay.set(day, {
        revenue: roundMoney(revenue),
        units,
        orderIds: new Set([order.id]),
      });
    }
  }

  const dayKeys = Array.from(perDay.keys()).sort();
  const start = from ?? dayKeys[0] ?? formatMexicoDate(new Date());
  const end = to ?? dayKeys[dayKeys.length - 1] ?? start;
  const span = daysInclusive(start, end);
  const seriesGrain: "day" | "week" | "month" =
    span > 120 ? "month" : span > 45 ? "week" : "day";

  const buckets = new Map<
    string,
    { label: string; revenue: number; units: number; orderIds: Set<string> }
  >();

  const ensure = (key: string, label: string) => {
    if (!buckets.has(key)) {
      buckets.set(key, {
        label,
        revenue: 0,
        units: 0,
        orderIds: new Set(),
      });
    }
    return buckets.get(key)!;
  };

  if (seriesGrain === "day") {
    for (let d = start; d <= end; d = addDaysIso(d, 1)) {
      ensure(d, formatDayLabel(d));
    }
  } else if (seriesGrain === "week") {
    for (let d = mondayOf(start); d <= end; d = addDaysIso(d, 7)) {
      ensure(d, formatDayLabel(d));
    }
  } else {
    const endMonth = monthKey(end);
    for (let ym = monthKey(start); ym <= endMonth; ) {
      ensure(ym, formatMonthLabel(ym));
      const [y, m] = ym.split("-").map(Number);
      const nextM = m === 12 ? 1 : m + 1;
      const nextY = m === 12 ? y + 1 : y;
      ym = `${nextY}-${String(nextM).padStart(2, "0")}`;
    }
  }

  for (const [day, acc] of perDay) {
    const key =
      seriesGrain === "day"
        ? day
        : seriesGrain === "week"
          ? mondayOf(day)
          : monthKey(day);
    const bucket = buckets.get(key) ?? ensure(key, key);
    bucket.revenue = roundMoney(bucket.revenue + acc.revenue);
    bucket.units += acc.units;
    for (const id of acc.orderIds) bucket.orderIds.add(id);
  }

  const series: SalesPoint[] = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, bucket]) => ({
      key,
      label: bucket.label,
      revenue: roundMoney(bucket.revenue),
      units: bucket.units,
      orderCount: bucket.orderIds.size,
    }));

  return { series, seriesGrain };
}

function aggregateSales(
  orders: OrderWithItems[],
  productId: string | null,
  sku: string | null
): { kpis: SalesKpis; byProduct: ProductSalesRow[] } {
  let productRevenue = 0;
  let unitsSold = 0;
  let orderTotal = 0;
  let tax = 0;
  let discount = 0;
  let shipping = 0;

  type Acc = {
    productId: string | null;
    name: string;
    sku: string;
    units: number;
    revenue: number;
    orderIds: Set<string>;
  };
  const byKey = new Map<string, Acc>();

  for (const order of orders) {
    orderTotal += order.total;
    tax += order.tax;
    discount += order.discount;
    shipping += order.shippingCost;

    const matchingItems = order.items.filter((item) =>
      itemMatches(item, productId, sku)
    );
    for (const item of matchingItems) {
      const line = roundMoney(item.price * item.quantity);
      productRevenue += line;
      unitsSold += item.quantity;
      const key = item.sku || item.productId || item.name;
      const prev = byKey.get(key);
      if (prev) {
        prev.units += item.quantity;
        prev.revenue = roundMoney(prev.revenue + line);
        prev.orderIds.add(order.id);
        if (item.productId && !prev.productId) prev.productId = item.productId;
        prev.name = item.name;
      } else {
        byKey.set(key, {
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          units: item.quantity,
          revenue: line,
          orderIds: new Set([order.id]),
        });
      }
    }
  }

  productRevenue = roundMoney(productRevenue);
  const byProduct: ProductSalesRow[] = Array.from(byKey.values())
    .map((row) => ({
      productId: row.productId,
      name: row.name,
      sku: row.sku,
      units: row.units,
      revenue: roundMoney(row.revenue),
      mixPercent:
        productRevenue === 0
          ? 0
          : roundMoney((row.revenue / productRevenue) * 100),
      orderCount: row.orderIds.size,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const orderCount = orders.length;
  return {
    kpis: {
      productRevenue,
      unitsSold,
      orderCount,
      averageTicket: orderCount === 0 ? 0 : roundMoney(orderTotal / orderCount),
      tax: roundMoney(tax),
      discount: roundMoney(discount),
      shipping: roundMoney(shipping),
      orderTotal: roundMoney(orderTotal),
    },
    byProduct,
  };
}

export async function getSalesReport(
  filters: SalesFilters
): Promise<SalesReport> {
  const { orders, sku } = await loadSalesOrders(filters);
  const { kpis, byProduct } = aggregateSales(
    orders,
    filters.productId,
    sku
  );
  const { series, seriesGrain } = buildSeries(
    orders,
    filters.productId,
    sku,
    filters.from,
    filters.to
  );
  return {
    kpis,
    byProduct,
    series,
    seriesGrain,
  };
}

export async function buildSalesCsv(
  filters: SalesFilters,
  kind: "detail" | "summary"
): Promise<string> {
  const { orders, sku } = await loadSalesOrders(filters);
  const { byProduct } = aggregateSales(orders, filters.productId, sku);

  const lines: string[] = [];
  if (kind === "summary") {
    lines.push(
      csvLine([
        "Producto",
        "SKU",
        "Unidades",
        "Ingreso",
        "Porcentaje mix",
        "Pedidos",
      ])
    );
    for (const row of byProduct) {
      lines.push(
        csvLine([
          row.name,
          row.sku,
          row.units,
          moneyCsv(row.revenue),
          moneyCsv(row.mixPercent),
          row.orderCount,
        ])
      );
    }
  } else {
    lines.push(
      csvLine([
        "Fecha",
        "Pedido",
        "Estatus",
        "Cliente",
        "Email",
        "Producto",
        "SKU",
        "Cantidad",
        "Precio unitario",
        "Ingreso línea",
        "Total pedido",
      ])
    );
    for (const order of orders) {
      const matchingItems = order.items.filter((item) =>
        itemMatches(item, filters.productId, sku)
      );
      const customer = order.user?.name || order.billingName;
      const email = order.user?.email || order.billingEmail;
      for (const item of matchingItems) {
        lines.push(
          csvLine([
            formatMexicoDateTime(saleInstant(order)),
            order.trackingNumber,
            orderStatusLabel(order.status),
            customer,
            email,
            item.name,
            item.sku,
            item.quantity,
            moneyCsv(item.price),
            moneyCsv(item.price * item.quantity),
            moneyCsv(order.total),
          ])
        );
      }
    }
  }

  return `\uFEFF${lines.join("\n")}\n`;
}

export function salesCsvFilename(kind: "detail" | "summary"): string {
  const stamp = formatMexicoDate(new Date());
  return kind === "summary"
    ? `ventas-productos-${stamp}.csv`
    : `ventas-detalle-${stamp}.csv`;
}
