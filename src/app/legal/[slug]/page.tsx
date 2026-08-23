import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/LegalPage";
import { LegalMarkdown } from "@/components/LegalMarkdown";
import { type LegalSlug } from "@/lib/legal";
import {
  formatLegalUpdatedAt,
  getLegalDocument,
  isLegalSlug,
} from "@/lib/legal-store";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isLegalSlug(params.slug)) {
    return { title: "Aviso legal | Mora & Hueso" };
  }
  const doc = await getLegalDocument(params.slug);
  return {
    title: `${doc.title} | Mora & Hueso`,
    description: doc.content.slice(0, 140).replace(/\s+/g, " "),
  };
}

export default async function LegalDocumentPage({ params }: Props) {
  if (!isLegalSlug(params.slug)) notFound();
  const slug = params.slug as LegalSlug;
  const doc = await getLegalDocument(slug);

  return (
    <LegalPage title={doc.title} updated={formatLegalUpdatedAt(doc.updatedAt)}>
      <LegalMarkdown content={doc.content} />
    </LegalPage>
  );
}
