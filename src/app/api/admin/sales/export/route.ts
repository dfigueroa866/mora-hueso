import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  buildSalesCsv,
  parseSalesFilters,
  salesCsvFilename,
} from "@/lib/sales-report";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const kindParam = searchParams.get("kind");
  const kind = kindParam === "summary" ? "summary" : kindParam === "detail" ? "detail" : null;
  if (!kind) {
    return NextResponse.json(
      { error: "Parámetro kind inválido. Usa detail o summary." },
      { status: 400 }
    );
  }

  const filters = parseSalesFilters(searchParams);
  const csv = await buildSalesCsv(filters, kind);
  const filename = salesCsvFilename(kind);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
