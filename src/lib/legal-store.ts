import { prisma } from "@/lib/db";
import {
  LEGAL_DEFAULTS,
  LEGAL_META,
  LEGAL_SLUGS,
  type LegalSlug,
} from "@/lib/legal";

export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}

export async function ensureLegalDocuments() {
  for (const slug of LEGAL_SLUGS) {
    await prisma.legalDocument.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title: LEGAL_META[slug].title,
        content: LEGAL_DEFAULTS[slug],
      },
    });
  }
}

export async function getLegalDocument(slug: LegalSlug) {
  await ensureLegalDocuments();
  return prisma.legalDocument.findUniqueOrThrow({ where: { slug } });
}

export async function listLegalDocuments() {
  await ensureLegalDocuments();
  return prisma.legalDocument.findMany({
    orderBy: { slug: "asc" },
  });
}

export function formatLegalUpdatedAt(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
