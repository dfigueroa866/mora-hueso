import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { REVENUE_ORDER_STATUSES } from "@/lib/constants";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [products, orders, lowStock, revenueAgg, pendingCount, cancelledCount] =
    await Promise.all([
      prisma.product.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.order.findMany({
        include: { items: true, user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.product.findMany({
        where: {
          active: true,
          OR: [{ stock: { lte: 0 } }],
        },
      }),
      prisma.order.aggregate({
        where: { status: { in: [...REVENUE_ORDER_STATUSES] } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.count({ where: { status: "pending_payment" } }),
      prisma.order.count({
        where: { status: { in: ["cancelled", "refunded"] } },
      }),
    ]);

  const lowStockAlerts = products.filter(
    (p) => p.active && p.stock <= p.lowStockAt
  );

  return NextResponse.json({
    products,
    orders,
    lowStockAlerts,
    outOfStock: products.filter((p) => p.stock <= 0 && p.active),
    stats: {
      productCount: products.filter((p) => p.active).length,
      inactiveCount: products.filter((p) => !p.active).length,
      orderCount: revenueAgg._count,
      revenue: revenueAgg._sum.total || 0,
      pendingCount,
      cancelledCount,
      lowStockCount: lowStockAlerts.length,
    },
    _meta: { lowStockRaw: lowStock.length },
  });
}
