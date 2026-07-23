import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { profileSchema, addressSchema } from "@/lib/validators";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      addresses: { orderBy: { isDefault: "desc" } },
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  return NextResponse.json(full);
}

export async function PUT(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  if (body.action === "address") {
    const parsed = addressSchema.safeParse(body.address);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dirección inválida", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    if (parsed.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }
    if (body.addressId) {
      const updated = await prisma.address.update({
        where: { id: body.addressId },
        data: {
          label: parsed.data.label || "Principal",
          street: parsed.data.street,
          city: parsed.data.city,
          state: parsed.data.state,
          postalCode: parsed.data.postalCode,
          country: parsed.data.country,
          references: parsed.data.references || null,
          isDefault: parsed.data.isDefault ?? false,
        },
      });
      return NextResponse.json(updated);
    }
    const created = await prisma.address.create({
      data: {
        userId: user.id,
        label: parsed.data.label || "Principal",
        street: parsed.data.street,
        city: parsed.data.city,
        state: parsed.data.state,
        postalCode: parsed.data.postalCode,
        country: parsed.data.country,
        references: parsed.data.references || null,
        isDefault: parsed.data.isDefault ?? false,
      },
    });
    return NextResponse.json(created, { status: 201 });
  }

  if (body.action === "deleteAddress" && body.addressId) {
    await prisma.address.deleteMany({
      where: { id: body.addressId, userId: user.id },
    });
    return NextResponse.json({ ok: true });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  return NextResponse.json(updated);
}
