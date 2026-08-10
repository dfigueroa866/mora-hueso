import { prisma } from "@/lib/db";
import { CatalogFilters } from "@/components/CatalogFilters";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TrustStamps } from "@/components/TrustStamps";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <HeroCarousel />
      <TrustStamps />

      <section id="catalogo" className="section-pad bg-section-wash">
        <div className="mb-10 max-w-xl">
          <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">
            Catálogo
          </h2>
          <p className="mt-2 text-ink-muted">
            Filtra por categoría, tamaño de perro, precio e ingredientes.
          </p>
        </div>
        <CatalogFilters products={products} />
      </section>
    </>
  );
}
