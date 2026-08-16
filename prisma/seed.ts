import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
    dogSize: "todos",
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
    dogSize: "pequeno",
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
    dogSize: "mediano",
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
    dogSize: "grande",
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
    dogSize: "todos",
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
    dogSize: "pequeno",
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
    dogSize: "grande",
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
    dogSize: "mediano",
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

async function main() {
  await prisma.reviewPhoto.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

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

  const sampleProducts = await prisma.product.findMany({ take: 3 });
  if (sampleProducts.length >= 2) {
    const subtotal = sampleProducts[0].price * 2 + sampleProducts[1].price;
    const tax = Math.round(subtotal * 0.16 * 100) / 100;
    const shippingCost = 79;
    await prisma.order.create({
      data: {
        userId: customer.id,
        status: "shipped",
        subtotal,
        tax,
        shippingCost,
        total: Math.round((subtotal + tax + shippingCost) * 100) / 100,
        shippingMethod: "standard",
        trackingNumber: "MH-DEMO-1001",
        shipStreet: "Av. Insurgentes Sur 1234",
        shipCity: "Ciudad de México",
        shipState: "CDMX",
        shipPostalCode: "03100",
        shipCountry: "México",
        shipReferences: "Edificio azul, depto 4B",
        billingName: "Ana Pérez",
        billingEmail: "cliente@demo.com",
        cardLast4: "4242",
        items: {
          create: [
            {
              productId: sampleProducts[0].id,
              name: sampleProducts[0].name,
              sku: sampleProducts[0].sku,
              quantity: 2,
              price: sampleProducts[0].price,
            },
            {
              productId: sampleProducts[1].id,
              name: sampleProducts[1].name,
              sku: sampleProducts[1].sku,
              quantity: 1,
              price: sampleProducts[1].price,
            },
          ],
        },
      },
    });
  }

  if (sampleProducts.length >= 2) {
    await prisma.review.create({
      data: {
        productId: sampleProducts[0].id,
        userId: customer.id,
        rating: 5,
        title: "Se las acabó en un día",
        comment:
          "Pedí las Moritas para entrenamiento y mi perrita responde súper rápido. Llegaron bien empacadas y sin olores raros.",
        photos: {
          create: [
            {
              url: sampleProducts[0].image,
            },
          ],
        },
      },
    });
    await prisma.review.create({
      data: {
        productId: sampleProducts[1].id,
        userId: customer.id,
        rating: 4,
        title: "Crujientes y sin grasa",
        comment:
          "Buenas galletas para premios cortos. Mi perro grande las disfruta; la próxima vez pediré el paquete más grande.",
      },
    });
  }

  console.log("Seed OK — productos:", products.length, "| admin:", admin.email, "| cliente:", customer.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
