import { NextRequest, NextResponse } from "next/server";
import { expirePendingOrders } from "@/lib/orders";

/**
 * POST /api/mercadopago/expire-pending
 * Cancela pedidos pending_payment más viejos que el TTL y restaura stock.
 * Protegido con header Authorization: Bearer <CRON_SECRET>
 * o x-cron-secret.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado" },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const headerSecret = req.headers.get("x-cron-secret") || "";
  if (bearer !== expected && headerSecret !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await expirePendingOrders();
  return NextResponse.json({
    ok: true,
    expiredCount: result.expired.length,
    expired: result.expired,
    cutoff: result.cutoff.toISOString(),
  });
}
