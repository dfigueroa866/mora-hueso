import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const [products, orders, lowStock, salesAgg] = await Promise.all([
    prisma.product.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.order.findMany({
      include: { items: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { stock: { lte: 0 } },
          // SQLite: compare stock to lowStockAt in JS below for simplicity
        ],
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      _count: true,
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
      orderCount: salesAgg._count,
      revenue: salesAgg._sum.total || 0,
      lowStockCount: lowStockAlerts.length,
    },
    // silence unused
    _meta: { lowStockRaw: lowStock.length },
  });
}
