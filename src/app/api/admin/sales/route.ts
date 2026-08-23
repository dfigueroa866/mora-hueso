import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSalesReport, parseSalesFilters } from "@/lib/sales-report";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filters = parseSalesFilters(searchParams);
  const report = await getSalesReport(filters);

  return NextResponse.json(report);
}
