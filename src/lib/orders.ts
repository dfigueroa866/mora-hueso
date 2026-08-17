import { prisma } from "@/lib/db";
import {
  getPendingPaymentTtlMinutes,
  isFinalOrderStatus,
} from "@/lib/constants";

/** Restaura stock y marca el pedido (solo si sigue pendiente). */
export async function restoreStockAndCancel(
  orderId: string,
  finalStatus: "cancelled" | "refunded" = "cancelled"
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return null;
    if (order.status !== "pending_payment") return order;

    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: finalStatus },
      include: { items: true },
    });
  });
}

export function pendingCutoffDate(now = new Date()) {
  const ttlMs = getPendingPaymentTtlMinutes() * 60 * 1000;
  return new Date(now.getTime() - ttlMs);
}

/** Cancela pedidos pending_payment más viejos que el TTL y restaura stock. */
export async function expirePendingOrders(now = new Date()) {
  const cutoff = pendingCutoffDate(now);
  const stale = await prisma.order.findMany({
    where: {
      status: "pending_payment",
      createdAt: { lt: cutoff },
    },
    select: { id: true, trackingNumber: true },
  });

  const expired: string[] = [];
  for (const order of stale) {
    const updated = await restoreStockAndCancel(order.id);
    if (updated?.status === "cancelled") {
      expired.push(order.trackingNumber);
    }
  }

  return { expired, cutoff };
}

export function shouldRestoreStockOnStatusChange(
  currentStatus: string,
  nextStatus: string
) {
  return (
    currentStatus === "pending_payment" &&
    (nextStatus === "cancelled" || nextStatus === "refunded")
  );
}

export function canUpdateOrderStatus(
  currentStatus: string,
  nextStatus: string
) {
  if (currentStatus === nextStatus) return true;
  if (isFinalOrderStatus(currentStatus) && currentStatus !== "confirmed") {
    // confirmed puede pasar a shipped; cancelled/refunded no cambian
    return false;
  }
  if (currentStatus === "confirmed" && nextStatus === "shipped") return true;
  if (currentStatus === "pending_payment") {
    return ["confirmed", "cancelled", "refunded"].includes(nextStatus);
  }
  if (currentStatus === "shipped" && nextStatus === "refunded") return true;
  return false;
}
