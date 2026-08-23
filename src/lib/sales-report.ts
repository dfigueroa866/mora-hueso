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

export type SalesReport = {
  kpis: SalesKpis;
  byProduct: ProductSalesRow[];
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
  return {
    kpis,
    byProduct,
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
