import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  SHIPPING_METHODS,
  TAX_RATE,
  generateTrackingNumber,
  roundMoney,
} from "@/lib/constants";
import { checkoutSchema } from "@/lib/validators";
import {
  allowDemoPayments,
  createCheckoutPreference,
  getAppBaseUrl,
  hasMercadoPagoToken,
} from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const session = await getSession();
  const baseUrl = getAppBaseUrl(req.url);

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
  const shipping = SHIPPING_METHODS.find((m) => m.value === data.shippingMethod)!;
  const shippingCost = shipping.cost;
  const total = roundMoney(subtotal + tax + shippingCost);
  const trackingNumber = generateTrackingNumber();

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
          paymentProvider: hasMercadoPagoToken() ? "mercadopago" : "demo",
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

    // Real Mercado Pago Checkout Pro
    if (hasMercadoPagoToken()) {
      try {
        const pref = await createCheckoutPreference({
          orderId: order.id,
          trackingNumber: order.trackingNumber,
          total: order.total,
          items: [
            ...lineItems.map((i) => ({
              title: i.name,
              quantity: i.quantity,
              unitPrice: i.price,
            })),
            ...(tax > 0
              ? [{ title: "IVA", quantity: 1, unitPrice: tax }]
              : []),
            {
              title: `Envío ${shipping.label}`,
              quantity: 1,
              unitPrice: shippingCost,
            },
          ],
          payerEmail: data.billingEmail,
          payerName: data.billingName,
          baseUrl,
        });

        await prisma.order.update({
          where: { id: order.id },
          data: { mpPreferenceId: pref.preferenceId },
        });

        return NextResponse.json({
          checkoutUrl: pref.initPoint,
          provider: "mercadopago",
          order: {
            id: order.id,
            trackingNumber: order.trackingNumber,
            total: order.total,
            subtotal: order.subtotal,
            tax: order.tax,
            shippingCost: order.shippingCost,
            shippingMethod: order.shippingMethod,
            status: order.status,
            items: order.items,
            emailSentTo: data.billingEmail,
          },
        });
      } catch (err) {
        console.error("Mercado Pago preference error", err);
        return NextResponse.json(
          {
            error:
              "No se pudo iniciar el pago con Mercado Pago. Revisa el Access Token.",
          },
          { status: 502 }
        );
      }
    }

    // Demo local without credentials
    if (allowDemoPayments()) {
      const demoUrl = `${baseUrl}/pago/demo?t=${order.trackingNumber}&orderId=${order.id}`;
      return NextResponse.json({
        checkoutUrl: demoUrl,
        provider: "demo",
        order: {
          id: order.id,
          trackingNumber: order.trackingNumber,
          total: order.total,
          subtotal: order.subtotal,
          tax: order.tax,
          shippingCost: order.shippingCost,
          shippingMethod: order.shippingMethod,
          status: order.status,
          items: order.items,
          emailSentTo: data.billingEmail,
        },
      });
    }

    return NextResponse.json(
      {
        error:
          "Configura MERCADOPAGO_ACCESS_TOKEN para aceptar pagos reales, o ALLOW_DEMO_PAYMENTS=true para pruebas locales.",
      },
      { status: 503 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("STOCK:")) {
      return NextResponse.json(
        { error: `Stock insuficiente para "${msg.slice(6)}"` },
        { status: 400 }
      );
    }
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo procesar el pedido" },
      { status: 500 }
    );
  }
}
