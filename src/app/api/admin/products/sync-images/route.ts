import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  listProductBlobImages,
  pickBestBlobImage,
} from "@/lib/blob-product-images";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let images;
  try {
    images = await listProductBlobImages("Products/");
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "No se pudieron listar las imágenes de Blob",
      },
      { status: 400 }
    );
  }

  if (images.length === 0) {
    return NextResponse.json({
      ok: false,
      error:
        "No hay imágenes en Blob bajo Products/. Sube JPG/PNG en Storage → Products.",
      blobCount: 0,
      updated: 0,
      skipped: 0,
      unmatched: [] as string[],
    });
  }

  const products = await prisma.product.findMany({
    select: { id: true, name: true, sku: true, image: true },
    orderBy: { name: "asc" },
  });

  const updated: { sku: string; name: string; url: string }[] = [];
  const unmatched: { sku: string; name: string }[] = [];
  let skipped = 0;
  let cleared = 0;
  const PLACEHOLDER =
    "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80";

  for (const product of products) {
    const match = pickBestBlobImage(product.name, images);
    if (!match) {
      unmatched.push({ sku: product.sku, name: product.name });
      if (product.image.includes("blob.vercel-storage.com")) {
        await prisma.product.update({
          where: { id: product.id },
          data: { image: PLACEHOLDER },
        });
        cleared += 1;
      }
      continue;
    }
    if (product.image === match.url) {
      skipped += 1;
      continue;
    }
    await prisma.product.update({
      where: { id: product.id },
      data: { image: match.url },
    });
    updated.push({
      sku: product.sku,
      name: product.name,
      url: match.url,
    });
  }

  return NextResponse.json({
    ok: unmatched.length === 0,
    blobCount: images.length,
    updated: updated.length,
    skipped,
    cleared,
    unmatched,
    updatedItems: updated.slice(0, 30),
  });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const images = await listProductBlobImages("Products/");
    return NextResponse.json({
      count: images.length,
      images: images.map((i) => ({
        fileName: i.fileName,
        pathname: i.pathname,
        url: i.url,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "No se pudieron listar las imágenes de Blob",
      },
      { status: 400 }
    );
  }
}
