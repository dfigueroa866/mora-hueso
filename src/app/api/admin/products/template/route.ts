import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { buildProductCsvTemplate } from "@/lib/csv-products";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const csv = buildProductCsvTemplate();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="plantilla-productos-mora-hueso.csv"',
      "Cache-Control": "no-store",
    },
  });
}
