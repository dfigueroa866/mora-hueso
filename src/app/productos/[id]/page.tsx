import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { preserveProductText } from "@/lib/text-encoding";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function ProductPage({ params }: Props) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product || !product.active) notFound();

  return (
    <div className="section-pad">
      <ProductDetailClient product={preserveProductText(product)} />
    </div>
  );
}
