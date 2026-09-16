"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  canUseNextImage,
  normalizeProductImageSrc,
} from "@/lib/product-image";

type ProductImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
};

export function ProductImage({
  src,
  alt,
  fill = false,
  sizes,
  className,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const url = normalizeProductImageSrc(src);

  if (!url || failed) {
    return (
      <div
        className={cn(fill && "absolute inset-0", "bg-bone-warm")}
        aria-hidden
      />
    );
  }

  // Prefer plain <img> for Blob: avoids next/image host-config edge cases
  // with spaces/accents in pathnames while still rendering public Blob URLs.
  if (canUseNextImage(url) && !url.includes("blob.vercel-storage.com")) {
    return (
      <Image
        src={url}
        alt={alt}
        fill={fill}
        sizes={sizes}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={cn(
        fill && "absolute inset-0 h-full w-full object-cover",
        className
      )}
      onError={() => setFailed(true)}
    />
  );
}
