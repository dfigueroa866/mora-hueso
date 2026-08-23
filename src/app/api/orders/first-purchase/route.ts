import { NextRequest, NextResponse } from "next/server";
import {
  isFirstPurchaseEmail,
  normalizeEmail,
} from "@/lib/first-purchase";
import { FIRST_PURCHASE_DISCOUNT_RATE } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const email = normalizeEmail(req.nextUrl.searchParams.get("email") || "");
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Correo inválido", eligible: false },
      { status: 400 }
    );
  }

  const eligible = await isFirstPurchaseEmail(email);
  return NextResponse.json({
    email,
    eligible,
    discountRate: FIRST_PURCHASE_DISCOUNT_RATE,
    discountPercent: Math.round(FIRST_PURCHASE_DISCOUNT_RATE * 100),
  });
}
