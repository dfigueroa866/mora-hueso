import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  SHIPPING_METHODS,
  TAX_RATE,
  generateTrackingNumber,
  roundMoney,
} from "@/lib/constants";
import { mercadoPagoCheckoutSchema } from "@/lib/validators";
import {
  createMercadoPagoPreference,
  getAppUrl,
} from "@/lib/mercadopago";

/**
 * POST /api/mercadopago/preference
 * Crea un pedido pendiente y una preferencia de Checkout Pro en Mercado Pago.
 * Responde con `init_point` para redirigir al pagador.
 */
export async function POST(req: NextRequest) {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Mercado Pago no está configurado. Define MERCADOPAGO_ACCESS_TOKEN.",
      },
      { status: 503 }
    );
  }

  const body = await req.json();
  const parsed = mercadoPagoCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const session = await getSession();

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "Uno o más productos ya no están disponibles" },
      { status: 400 }
    );
  }

  const lineItems: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }[] = [];

  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.stock < item.quantity) {
      return NextResponse.json(
        {
          error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`,
        },
        { status: 400 }
      );
    }
    lineItems.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: item.quantity,
      price: product.price,
    });
  }

  const subtotal = roundMoney(
    lineItems.reduce((s, i) => s + i.price * i.quantity, 0)
  );
  const tax = roundMoney(subtotal * TAX_RATE);
  const shipping = SHIPPING_METHODS.find(
    (m) => m.value === data.shippingMethod
  )!;
  const shippingCost = shipping.cost;
  const total = roundMoney(subtotal + tax + shippingCost);
  const trackingNumber = generateTrackingNumber();
  const appUrl = getAppUrl();

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`STOCK:${item.name}`);
        }
      }

      return tx.order.create({
        data: {
          userId: session?.id,
          guestEmail: session ? null : data.billingEmail,
          status: "pending_payment",
          subtotal,
          tax,
          shippingCost,
          total,
          shippingMethod: data.shippingMethod,
          trackingNumber,
          shipStreet: data.shipStreet,
          shipCity: data.shipCity,
          shipState: data.shipState,
          shipPostalCode: data.shipPostalCode,
          shipCountry: data.shipCountry,
          shipReferences: data.shipReferences || null,
          billingName: data.billingName,
          billingEmail: data.billingEmail,
          paymentProvider: "mercadopago",
          items: {
            create: lineItems.map((i) => ({
              productId: i.productId,
              name: i.name,
              sku: i.sku,
              quantity: i.quantity,
              price: i.price,
            })),
          },
        },
        include: { items: true },
      });
    });

    const preferenceItems = [
      ...lineItems.map((i) => ({
        id: i.productId,
        title: i.name,
        description: `SKU ${i.sku}`,
        quantity: i.quantity,
        unit_price: i.price,
        currency_id: "MXN",
      })),
      {
        id: "tax",
        title: "IVA",
        quantity: 1,
        unit_price: tax,
        currency_id: "MXN",
      },
      {
        id: "shipping",
        title: shipping.label,
        quantity: 1,
        unit_price: shippingCost,
        currency_id: "MXN",
      },
    ];

    let preference;
    try {
      preference = await createMercadoPagoPreference({
        items: preferenceItems,
        payerEmail: data.billingEmail,
        payerName: data.billingName,
        externalReference: order.id,
        notificationUrl: `${appUrl}/api/mercadopago/webhook`,
        backUrls: {
          success: `${appUrl}/confirmacion?t=${trackingNumber}&status=approved`,
          pending: `${appUrl}/confirmacion?t=${trackingNumber}&status=pending`,
          failure: `${appUrl}/checkout?status=failure&t=${trackingNumber}`,
        },
      });
    } catch (mpError) {
      await restoreStockAndCancel(order.id);
      throw mpError;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: preference.id },
    });

    const useSandbox =
      process.env.MERCADOPAGO_USE_SANDBOX === "true" &&
      preference.sandbox_init_point;

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: useSandbox
        ? preference.sandbox_init_point
        : preference.init_point,
      order: {
        id: order.id,
        trackingNumber: order.trackingNumber,
        total: order.total,
        subtotal: order.subtotal,
        tax: order.tax,
        shippingCost: order.shippingCost,
        shippingMethod: order.shippingMethod,
        status: order.status,
        paymentProvider: "mercadopago",
        items: order.items,
        emailSentTo: data.billingEmail,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("STOCK:")) {
      return NextResponse.json(
        { error: `Stock insuficiente para "${msg.slice(6)}"` },
        { status: 400 }
      );
    }
    console.error("[Mercado Pago] preference error:", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "No se pudo iniciar el pago con Mercado Pago",
      },
      { status: 500 }
    );
  }
}

async function restoreStockAndCancel(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    for (const item of order.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
    });
  });
}
