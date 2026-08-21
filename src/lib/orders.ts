import { prisma } from "@/lib/db";

export async function restoreOrderStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
  });
}

export async function markOrderPaid(input: {
  orderId: string;
  mpPaymentId?: string | null;
}) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) return null;
  if (order.status === "paid" || order.status === "shipped") return order;

  return prisma.order.update({
    where: { id: order.id },
    data: {
      status: "paid",
      mpPaymentId: input.mpPaymentId || order.mpPaymentId,
      paidAt: new Date(),
    },
    include: { items: true },
  });
}

export async function markOrderCancelled(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  if (order.status === "cancelled") return order;
  if (order.status === "paid" || order.status === "shipped") return order;

  await restoreOrderStock(orderId);
  return prisma.order.update({
    where: { id: orderId },
    data: { status: "cancelled" },
    include: { items: true },
  });
}

export function orderStatusLabel(status: string) {
  switch (status) {
    case "pending_payment":
      return "Pago pendiente";
    case "paid":
      return "Pagado";
    case "cancelled":
      return "Cancelado";
    case "shipped":
      return "Enviado";
    case "confirmed":
      return "Confirmado";
    default:
      return status;
  }
}
