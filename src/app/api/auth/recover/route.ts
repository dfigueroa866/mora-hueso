import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { recoverSchema, resetSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.token && body.password) {
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: parsed.data.token,
        resetExpires: { gt: new Date() },
      },
    });
    if (!user) {
      return NextResponse.json(
        { error: "El enlace expiró o no es válido" },
        { status: 400 }
      );
    }

    const password = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password, resetToken: null, resetExpires: null },
    });
    return NextResponse.json({ ok: true, message: "Contraseña actualizada" });
  }

  const parsed = recoverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Correo inválido" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  // Always respond OK to avoid email enumeration; include token in demo mode
  if (!user) {
    return NextResponse.json({
      ok: true,
      message: "Si el correo existe, enviamos instrucciones.",
    });
  }

  const resetToken = randomBytes(24).toString("hex");
  const resetExpires = new Date(Date.now() + 1000 * 60 * 60);
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetExpires },
  });

  return NextResponse.json({
    ok: true,
    message:
      "Si el correo existe, enviamos instrucciones. (Demo: usa el token abajo)",
    demoToken: resetToken,
    demoResetUrl: `/recuperar?token=${resetToken}`,
  });
}
