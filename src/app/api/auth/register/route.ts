import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese correo" },
      { status: 409 }
    );
  }

  const password = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      password,
      phone: parsed.data.phone,
      role: "customer",
    },
  });

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const res = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
  setSessionCookie(res, token);
  return res;
}
