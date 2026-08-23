import { PrismaClient } from "../node_modules/.prisma/client-v2";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { LEGAL_DEFAULTS, LEGAL_META, LEGAL_SLUGS } from "../src/lib/legal";

if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      let value = m[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
  }
}

const prisma = new PrismaClient();

const products = [
  {
    name: "Moritas de Res Deshidratada",
    description:
      "Tiras suaves de res deshidratada a baja temperatura. Ideal como premio de entrenamiento o recompensa diaria sin rellenos artificiales.",
    price: 189,
    category: "naturales",
    stock: 42,
    sku: "MH-NAT-001",
    supplier: "Rancho Alto",
    packageSize: "150 g",
    ingredients: "res, nada más",
    nutrition: JSON.stringify({
      protein: "68%",
      fat: "12%",
      fiber: "2%",
      moisture: "10%",
      ash: "8%",
    }),
    image:
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&q=80",
    lowStockAt: 10,
  },
  {
    name: "Galletas de Calabaza y Avena",
    description:
      "Galletas horneadas con calabaza asada y avena integral. Textura crujiente que a los perros les encanta morder.",
    price: 129,
    category: "galletas",
    stock: 58,
    sku: "MH-GAL-002",
    supplier: "Horno Canino",
    packageSize: "200 g",
    ingredients: "avena, calabaza, huevo, aceite de coco",
    nutrition: JSON.stringify({
      protein: "14%",
      fat: "8%",
      fiber: "6%",
      moisture: "8%",
      ash: "4%",
    }),
    image:
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80",
    lowStockAt: 12,
  },
  {
    name: "Hueso de Yuca Prensado",
    description:
      "Hueso largo de yuca prensada para masticación prolongada. Ayuda a reducir el aburrimiento y limpia dientes de forma natural.",
    price: 99,
    category: "huesos",
    stock: 8,
    sku: "MH-HUE-003",
    supplier: "Masticables del Sur",
    packageSize: "1 pza · 80 g",
    ingredients: "yuca, almidón vegetal",
    nutrition: JSON.stringify({
      protein: "3%",
      fat: "1%",
      fiber: "12%",
      moisture: "9%",
      ash: "2%",
    }),
    image:
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80",
    lowStockAt: 10,
  },
  {
    name: "Snacks Dentales Menta Verde",
    description:
      "Palitos dentales con menta y clorofila para frescar el aliento y reducir placa. Forma en espiral que limpia al masticar.",
    price: 159,
    category: "dentales",
    stock: 35,
    sku: "MH-DEN-004",
    supplier: "SmilePaw",
    packageSize: "12 pzas · 180 g",
    ingredients: "arroz, menta, clorofila, aceite de pescado",
    nutrition: JSON.stringify({
      protein: "12%",
      fat: "5%",
      fiber: "8%",
      moisture: "10%",
      ash: "5%",
    }),
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
    lowStockAt: 10,
  },
  {
    name: "Premios de Pollo Liofilizado",
    description:
      "Cubos de pechuga de pollo liofilizada que conservan el 97% de nutrientes. Altísimo valor como refuerzo positivo.",
    price: 249,
    category: "naturales",
    stock: 22,
    sku: "MH-NAT-005",
    supplier: "Rancho Alto",
    packageSize: "100 g",
    ingredients: "pollo",
    nutrition: JSON.stringify({
      protein: "78%",
      fat: "9%",
      fiber: "1%",
      moisture: "4%",
      ash: "8%",
    }),
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
    lowStockAt: 8,
  },
  {
    name: "Galletas de Manzana y Canela",
    description:
      "Galletas aromáticas con manzana deshidratada y un toque de canela. Perfectas para perros pequeños y entrenamientos cortos.",
    price: 119,
    category: "galletas",
    stock: 5,
    sku: "MH-GAL-006",
    supplier: "Horno Canino",
    packageSize: "180 g",
    ingredients: "harina de arroz, manzana, canela, miel",
    nutrition: JSON.stringify({
      protein: "10%",
      fat: "6%",
      fiber: "5%",
      moisture: "9%",
      ash: "3%",
    }),
    image:
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&q=80",
    lowStockAt: 10,
  },
  {
    name: "Hueso de Tendón de Res",
    description:
      "Tendón natural enrollado, rico en colágeno. Masticable resistente recomendado para perros de talla mediana y grande.",
    price: 145,
    category: "huesos",
    stock: 18,
    sku: "MH-HUE-007",
    supplier: "Masticables del Sur",
    packageSize: "1 pza · 120 g",
    ingredients: "tendón de res",
    nutrition: JSON.stringify({
      protein: "82%",
      fat: "4%",
      fiber: "0%",
      moisture: "8%",
      ash: "6%",
    }),
    image:
      "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800&q=80",
    lowStockAt: 8,
  },
  {
    name: "Sticks Dentales Coco",
    description:
      "Barras dentales con aceite de coco virgen. Ayudan a controlar el sarro y aportan ácidos grasos beneficiosos.",
    price: 139,
    category: "dentales",
    stock: 0,
    sku: "MH-DEN-008",
    supplier: "SmilePaw",
    packageSize: "10 pzas · 160 g",
    ingredients: "arroz, aceite de coco, zanahoria, perejil",
    nutrition: JSON.stringify({
      protein: "11%",
      fat: "7%",
      fiber: "7%",
      moisture: "11%",
      ash: "4%",
    }),
    image:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&q=80",
    lowStockAt: 10,
  },
];

const TAX_RATE = 0.16;
const FIRST_PURCHASE_RATE = 0.1;
const SALES_STATUSES = new Set(["paid", "shipped", "confirmed"]);

type CatalogProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  image: string;
};

type SeedBuyer = {
  userId: string | null;
  name: string;
  email: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  references: string;
};

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function mexicoDate(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number
) {
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mi = String(minute).padStart(2, "0");
  return new Date(`${year}-${mm}-${dd}T${hh}:${mi}:00-06:00`);
}

function calcTotals(
  subtotal: number,
  shippingCost: number,
  applyDiscount: boolean
) {
  const discount = applyDiscount
    ? roundMoney(subtotal * FIRST_PURCHASE_RATE)
    : 0;
  const taxable = roundMoney(Math.max(0, subtotal - discount));
  const tax = roundMoney(taxable * TAX_RATE);
  const total = roundMoney(taxable + tax + shippingCost);
  return { discount, tax, total };
}

async function seedYearOfOrders(
  catalog: CatalogProduct[],
  buyers: SeedBuyer[],
  demoCustomer: SeedBuyer
) {
  const rand = mulberry32(20260823);
  const randInt = (min: number, max: number) =>
    min + Math.floor(rand() * (max - min + 1));
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];

  const seenEmails = new Set<string>();
  let seq = 1;
  let created = 0;
  let countedSales = 0;

  const skuWeights: Record<string, number> = {
    "MH-NAT-001": 5,
    "MH-GAL-002": 4,
    "MH-HUE-003": 2,
    "MH-DEN-004": 3,
    "MH-NAT-005": 5,
    "MH-GAL-006": 2,
    "MH-HUE-007": 3,
    "MH-DEN-008": 2,
  };

  function pickProduct() {
    const weighted = catalog.flatMap((p) =>
      Array.from({ length: skuWeights[p.sku] ?? 1 }, () => p)
    );
    return weighted[Math.floor(rand() * weighted.length)] ?? catalog[0];
  }

  async function createOrder(opts: {
    at: Date;
    buyer: SeedBuyer;
    status: string;
    trackingNumber?: string;
    forceItems?: { product: CatalogProduct; quantity: number }[];
    forceShipping?: "standard" | "express";
    skipPaidAt?: boolean;
  }) {
    const itemCount = opts.forceItems
      ? opts.forceItems.length
      : randInt(1, 3);
    const chosen = opts.forceItems
      ? opts.forceItems
      : Array.from({ length: itemCount }, () => ({
          product: pickProduct(),
          quantity: randInt(1, 3),
        }));

    const merged = new Map<
      string,
      { product: CatalogProduct; quantity: number }
    >();
    for (const row of chosen) {
      const prev = merged.get(row.product.id);
      if (prev) prev.quantity += row.quantity;
      else merged.set(row.product.id, { ...row });
    }
    const lines = Array.from(merged.values());
    const subtotal = roundMoney(
      lines.reduce((s, l) => s + l.product.price * l.quantity, 0)
    );
    const shippingMethod =
      opts.forceShipping ?? (rand() < 0.22 ? "express" : "standard");
    const shippingCost = shippingMethod === "express" ? 149 : 79;
    const email = opts.buyer.email.toLowerCase();
    const isSale = SALES_STATUSES.has(opts.status);
    const applyDiscount = isSale && !seenEmails.has(email);
    if (isSale) seenEmails.add(email);
    const { discount, tax, total } = calcTotals(
      subtotal,
      shippingCost,
      applyDiscount
    );
    const tracking =
      opts.trackingNumber ?? `MH-YR-${String(seq).padStart(4, "0")}`;
    seq += 1;
    const paidAt =
      isSale && !opts.skipPaidAt
        ? new Date(opts.at.getTime() + randInt(4, 90) * 60 * 1000)
        : null;

    await prisma.order.create({
      data: {
        userId: opts.buyer.userId,
        guestEmail: opts.buyer.userId ? null : opts.buyer.email,
        status: opts.status,
        subtotal,
        discount,
        tax,
        shippingCost,
        total,
        shippingMethod,
        trackingNumber: tracking,
        shipStreet: opts.buyer.street,
        shipCity: opts.buyer.city,
        shipState: opts.buyer.state,
        shipPostalCode: opts.buyer.postalCode,
        shipCountry: "México",
        shipReferences: opts.buyer.references,
        billingName: opts.buyer.name,
        billingEmail: opts.buyer.email,
        cardLast4: String(1000 + randInt(0, 8999)),
        paymentProvider: "mercadopago",
        paidAt,
        createdAt: opts.at,
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            name: l.product.name,
            sku: l.product.sku,
            quantity: l.quantity,
            price: l.product.price,
          })),
        },
      },
    });
    created += 1;
    if (isSale) countedSales += 1;
  }

  function monthOrderCount(year: number, monthIndex: number) {
    // Agosto 2025 solo tiene la última semana; agosto 2026 hasta el día 23.
    if (year === 2025 && monthIndex === 7) return 8;
    if (year === 2026 && monthIndex === 7) return 14;
    if (monthIndex === 11) return 24;
    if (monthIndex === 10) return 16;
    if (monthIndex === 0) return 9;
    if (monthIndex === 4 || monthIndex === 5) return 12;
    return 11;
  }

  function pickStatus() {
    const roll = rand();
    if (roll < 0.06) return "pending_payment";
    if (roll < 0.11) return "cancelled";
    if (roll < 0.42) return "paid";
    if (roll < 0.82) return "shipped";
    return "confirmed";
  }

  for (let year = 2025; year <= 2026; year++) {
    const startMonth = year === 2025 ? 7 : 0;
    const endMonth = year === 2026 ? 7 : 11;
    for (let month = startMonth; month <= endMonth; month++) {
      const maxDay = daysInMonth(year, month);
      const fromDay = year === 2025 && month === 7 ? 24 : 1;
      const toDay = year === 2026 && month === 7 ? 23 : maxDay;
      const count = monthOrderCount(year, month);
      for (let i = 0; i < count; i++) {
        const day = randInt(fromDay, toDay);
        const at = mexicoDate(
          year,
          month,
          day,
          randInt(8, 21),
          randInt(0, 59)
        );
        await createOrder({
          at,
          buyer: pick(buyers),
          status: pickStatus(),
        });
      }
    }
  }

  const moritas = catalog.find((p) => p.sku === "MH-NAT-001") ?? catalog[0];
  const galletas = catalog.find((p) => p.sku === "MH-GAL-002") ?? catalog[1];

  // Anclas para validar filtros: hoy, 7 días, 30 días, mes, año, inicio del periodo.
  await createOrder({
    at: mexicoDate(2026, 7, 17, 21, 22),
    buyer: demoCustomer,
    status: "shipped",
    trackingNumber: "MH-DEMO-1001",
    forceItems: [
      { product: moritas, quantity: 2 },
      { product: galletas, quantity: 1 },
    ],
    forceShipping: "standard",
    skipPaidAt: true,
  });
  await createOrder({
    at: mexicoDate(2026, 7, 23, 10, 15),
    buyer: demoCustomer,
    status: "paid",
    trackingNumber: "MH-HOY-0001",
    forceItems: [{ product: moritas, quantity: 1 }],
  });
  await createOrder({
    at: mexicoDate(2026, 7, 20, 16, 40),
    buyer: pick(buyers),
    status: "confirmed",
    trackingNumber: "MH-7D-0001",
  });
  await createOrder({
    at: mexicoDate(2026, 6, 28, 11, 5),
    buyer: pick(buyers),
    status: "paid",
    trackingNumber: "MH-30D-0001",
  });
  await createOrder({
    at: mexicoDate(2026, 0, 12, 9, 30),
    buyer: pick(buyers),
    status: "shipped",
    trackingNumber: "MH-ANO-0001",
  });
  await createOrder({
    at: mexicoDate(2025, 7, 24, 13, 0),
    buyer: pick(buyers),
    status: "paid",
    trackingNumber: "MH-INI-0001",
  });
  await createOrder({
    at: mexicoDate(2026, 7, 22, 19, 45),
    buyer: pick(buyers),
    status: "pending_payment",
    trackingNumber: "MH-PEND-0001",
  });
  await createOrder({
    at: mexicoDate(2026, 7, 21, 12, 10),
    buyer: pick(buyers),
    status: "cancelled",
    trackingNumber: "MH-CANC-0001",
  });

  return { created, countedSales };
}

async function main() {
  await prisma.reviewPhoto.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.legalDocument.deleteMany();

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  const adminHash = await bcrypt.hash("Admin123!", 10);
  const customerHash = await bcrypt.hash("Cliente123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin Mora",
      email: "admin@morahueso.com",
      password: adminHash,
      phone: "5551234567",
      role: "admin",
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: "Ana Pérez",
      email: "cliente@demo.com",
      password: customerHash,
      phone: "5559876543",
      role: "customer",
      addresses: {
        create: {
          label: "Casa",
          street: "Av. Insurgentes Sur 1234",
          city: "Ciudad de México",
          state: "CDMX",
          postalCode: "03100",
          country: "México",
          references: "Edificio azul, depto 4B",
          isDefault: true,
        },
      },
    },
  });

  const extraBuyersData = [
    {
      name: "Luis García",
      email: "luis@demo.com",
      phone: "3331112233",
      street: "Av. Chapultepec 450",
      city: "Guadalajara",
      state: "Jalisco",
      postalCode: "44100",
      references: "Portón negro",
    },
    {
      name: "María López",
      email: "maria@demo.com",
      phone: "8185551212",
      street: "Calle Morelos 88",
      city: "Monterrey",
      state: "Nuevo León",
      postalCode: "64000",
      references: "Casa de dos pisos",
    },
    {
      name: "Carlos Ruiz",
      email: "carlos@demo.com",
      phone: "2224447788",
      street: "Blvd. 5 de Mayo 210",
      city: "Puebla",
      state: "Puebla",
      postalCode: "72000",
      references: "Junto al parque",
    },
  ];

  const extraUsers: SeedBuyer[] = [];
  for (const b of extraBuyersData) {
    const user = await prisma.user.create({
      data: {
        name: b.name,
        email: b.email,
        password: customerHash,
        phone: b.phone,
        role: "customer",
        addresses: {
          create: {
            label: "Casa",
            street: b.street,
            city: b.city,
            state: b.state,
            postalCode: b.postalCode,
            country: "México",
            references: b.references,
            isDefault: true,
          },
        },
      },
    });
    extraUsers.push({
      userId: user.id,
      name: b.name,
      email: b.email,
      street: b.street,
      city: b.city,
      state: b.state,
      postalCode: b.postalCode,
      references: b.references,
    });
  }

  const demoBuyer: SeedBuyer = {
    userId: customer.id,
    name: "Ana Pérez",
    email: "cliente@demo.com",
    street: "Av. Insurgentes Sur 1234",
    city: "Ciudad de México",
    state: "CDMX",
    postalCode: "03100",
    references: "Edificio azul, depto 4B",
  };

  const guestBuyers: SeedBuyer[] = [
    {
      userId: null,
      name: "Sofía Hernández",
      email: "sofia.guest@demo.com",
      street: "Calle 60 412",
      city: "Mérida",
      state: "Yucatán",
      postalCode: "97000",
      references: "Frente a la plaza",
    },
    {
      userId: null,
      name: "Jorge Medina",
      email: "jorge.guest@demo.com",
      street: "Av. Universidad 1500",
      city: "Querétaro",
      state: "Querétaro",
      postalCode: "76000",
      references: "Torre B, depto 8",
    },
  ];

  const catalog = await prisma.product.findMany();
  const sampleProducts = catalog.slice(0, 3);
  const yearSales = await seedYearOfOrders(
    catalog,
    [demoBuyer, ...extraUsers, ...guestBuyers],
    demoBuyer
  );

  if (sampleProducts.length >= 2) {
    const demoReviews = [
      {
        productId: sampleProducts[0].id,
        rating: 5,
        title: "Se las acabó en un día",
        comment:
          "Pedí las Moritas para entrenamiento y mi perrita responde súper rápido. Llegaron bien empacadas y sin olores raros.",
        withPhoto: true,
      },
      {
        productId: sampleProducts[1].id,
        rating: 4,
        title: "Crujientes y sin grasa",
        comment:
          "Buenas galletas para premios cortos. Mi perro grande las disfruta; la próxima vez pediré el paquete más grande.",
      },
      {
        productId: sampleProducts[0].id,
        rating: 5,
        title: "Ideal para paseos",
        comment:
          "Las llevo en la bolsa del parque. No manchan y mi perro las reconoce al instante.",
      },
      {
        productId: sampleProducts[1].id,
        rating: 3,
        title: "Buen sabor, paquete chico",
        comment:
          "Le gustaron mucho, pero se terminan rápido si tienes más de un perro en casa.",
      },
      {
        productId: sampleProducts[2]?.id || sampleProducts[0].id,
        rating: 5,
        title: "Masticación larga",
        comment:
          "Nos duró casi una hora. Perfecto para días lluviosos cuando necesita entretenimiento.",
      },
      {
        productId: sampleProducts[0].id,
        rating: 4,
        title: "Buen olor natural",
        comment:
          "Se nota que es res real. No tiene ese olor artificial de otros premios del súper.",
      },
      {
        productId: sampleProducts[1].id,
        rating: 5,
        title: "Repetiré la compra",
        comment:
          "Llegó rapidísimo y en buen estado. Mi perrita ya las espera cuando abro la cocina.",
      },
    ];

    for (const item of demoReviews) {
      const product = sampleProducts.find((p) => p.id === item.productId) || sampleProducts[0];
      await prisma.review.create({
        data: {
          productId: item.productId,
          userId: customer.id,
          rating: item.rating,
          title: item.title,
          comment: item.comment,
          photos:
            "withPhoto" in item && item.withPhoto
              ? { create: [{ url: product.image }] }
              : undefined,
        },
      });
    }
  }

  for (const slug of LEGAL_SLUGS) {
    await prisma.legalDocument.create({
      data: {
        slug,
        title: LEGAL_META[slug].title,
        content: LEGAL_DEFAULTS[slug],
      },
    });
  }

  console.log(
    "Seed OK — productos:",
    products.length,
    "| pedidos:",
    yearSales.created,
    "| ventas cobradas:",
    yearSales.countedSales,
    "| políticas:",
    LEGAL_SLUGS.length,
    "| admin:",
    admin.email,
    "| cliente:",
    customer.email
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
