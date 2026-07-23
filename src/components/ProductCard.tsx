import Link from "next/link";
import Image from "next/image";
import { formatPrice, categoryLabel, isAvailable } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  name: string;
  price: number;
  category: string;
  packageSize: string;
  image: string;
  stock: number;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const available = isAvailable(product.stock);

  return (
    <Link
      href={`/productos/${product.id}`}
      className="group block animate-fade-up"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-bone-warm">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width:768px) 50vw, 25vw"
          className={cn(
            "object-cover transition duration-700 group-hover:scale-105",
            !available && "grayscale"
          )}
        />
        {!available && (
          <span className="absolute left-3 top-3 bg-ink/90 px-2 py-1 text-[10px] uppercase tracking-wider text-bone">
            No disponible
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          {categoryLabel(product.category)} · {product.packageSize}
        </p>
        <h3 className="font-display text-lg leading-snug text-ink transition group-hover:text-berry">
          {product.name}
        </h3>
        <p className="text-sm font-medium text-ink">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
