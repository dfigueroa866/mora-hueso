import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  ensureLegalDocuments,
  getLegalDocument,
  isLegalSlug,
  formatLegalUpdatedAt,
} from "@/lib/legal-store";
import { LEGAL_META } from "@/lib/legal";

const updateSchema = z.object({
  title: z.string().min(3, "Título demasiado corto").max(160),
  content: z.string().min(20, "El contenido es demasiado corto").max(50000),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isLegalSlug(params.slug)) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }
  const doc = await getLegalDocument(params.slug);
  return NextResponse.json({
    document: {
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      content: doc.content,
      updatedAt: doc.updatedAt,
      updatedLabel: formatLegalUpdatedAt(doc.updatedAt),
      href: LEGAL_META[params.slug].href,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!isLegalSlug(params.slug)) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Datos inválidos" },
      { status: 400 }
    );
  }

  await ensureLegalDocuments();
  const document = await prisma.legalDocument.update({
    where: { slug: params.slug },
    data: {
      title: parsed.data.title.trim(),
      content: parsed.data.content.trim(),
    },
  });

  return NextResponse.json({
    document: {
      ...document,
      updatedLabel: formatLegalUpdatedAt(document.updatedAt),
      href: LEGAL_META[params.slug].href,
    },
  });
}
