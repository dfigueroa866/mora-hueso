import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listLegalDocuments } from "@/lib/legal-store";
import { LEGAL_META, type LegalSlug } from "@/lib/legal";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const docs = await listLegalDocuments();
  return NextResponse.json({
    documents: docs.map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      content: d.content,
      updatedAt: d.updatedAt,
      href: LEGAL_META[d.slug as LegalSlug]?.href ?? `/legal/${d.slug}`,
    })),
  });
}
