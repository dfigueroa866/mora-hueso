import { prisma } from "@/lib/db";
import {
  findLatestPaymentForOrder,
  hasMercadoPagoToken,
  mapMpStatusToOrderStatus,
} from "@/lib/mercadopago";

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

export type MercadoPagoReturn = {
  id?: string | number | null;
  status?: string | null;
  status_detail?: string | null;
  payment_method_id?: string | null;
  payment_type_id?: string | null;
  order?: { id?: string | number | null } | null;
  merchantOrderId?: string | null;
};

function returnFields(payment: MercadoPagoReturn) {
  const method = [payment.payment_type_id, payment.payment_method_id]
    .filter(Boolean)
    .join(" · ");
  return {
    ...(payment.id != null ? { mpPaymentId: String(payment.id) } : {}),
    ...(payment.status ? { mpStatus: payment.status } : {}),
    ...(payment.status_detail ? { mpStatusDetail: payment.status_detail } : {}),
    ...(method ? { mpPaymentMethod: method } : {}),
    ...(payment.merchantOrderId || payment.order?.id != null
      ? {
          mpMerchantOrderId: String(
            payment.merchantOrderId || payment.order?.id
          ),
        }
      : {}),
    mpNotifiedAt: new Date(),
  };
}

export async function markOrderPaid(input: {
  orderId: string;
  mpPaymentId?: string | null;
  mp?: MercadoPagoReturn | null;
}) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) return null;
  if (order.status === "paid" || order.status === "shipped") {
    if (!input.mp) return order;
    return prisma.order.update({
      where: { id: order.id },
      data: returnFields(input.mp),
      include: { items: true },
    });
  }

  return prisma.order.update({
    where: { id: order.id },
    data: {
      status: "paid",
      mpPaymentId: input.mpPaymentId || order.mpPaymentId,
      paidAt: new Date(),
      ...(input.mp ? returnFields(input.mp) : { mpStatus: "approved" }),
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

export async function applyMercadoPagoStatus(
  orderId: string,
  payment: MercadoPagoReturn
) {
  const next = mapMpStatusToOrderStatus(payment.status);
  const paymentId = payment.id != null ? String(payment.id) : null;
  if (next === "paid") {
    return markOrderPaid({ orderId, mpPaymentId: paymentId, mp: payment });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;

  if (next === "cancelled") {
    const samePayment =
      Boolean(paymentId) &&
      Boolean(order.mpPaymentId) &&
      order.mpPaymentId === paymentId;
    // No tumbar un cobro ya acreditado si llega otro intento rechazado.
    if (
      (order.status === "paid" || order.status === "shipped") &&
      !samePayment
    ) {
      return prisma.order.update({
        where: { id: orderId },
        data: returnFields(payment),
        include: { items: true },
      });
    }
    if (order.status !== "cancelled") {
      if (order.status === "pending_payment" || samePayment) {
        await restoreOrderStock(orderId);
      }
    }
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status: order.status === "shipped" ? "shipped" : "cancelled",
        ...returnFields(payment),
      },
      include: { items: true },
    });
  }

  return prisma.order.update({
    where: { id: orderId },
    data: returnFields(payment),
    include: { items: true },
  });
}

/** Recupera pagos de prueba que no regresaron a la tienda. */
export async function syncPendingMercadoPagoOrders() {
  if (!hasMercadoPagoToken()) return;
  const pending = await prisma.order.findMany({
    where: { status: "pending_payment", paymentProvider: "mercadopago" },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { id: true },
  });
  for (const order of pending) {
    try {
      const payment = await findLatestPaymentForOrder(order.id);
      if (!payment?.status) continue;
      await applyMercadoPagoStatus(order.id, payment);
    } catch (err) {
      console.error("sync pending Mercado Pago", err);
    }
  }
}

export async function claimGuestOrders(user: { id: string; email: string }) {
  const email = user.email.trim().toLowerCase();
  if (!email) return;
  await prisma.order.updateMany({
    where: {
      userId: null,
      OR: [{ billingEmail: email }, { guestEmail: email }],
    },
    data: { userId: user.id, guestEmail: null },
  });
}

export { orderStatusLabel } from "@/lib/order-status";

