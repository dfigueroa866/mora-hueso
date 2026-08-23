import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validators";

const MAX_PHOTOS = 4;
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function reviewInclude() {
  return {
    product: { select: { id: true, name: true, image: true } },
    user: { select: { id: true, name: true } },
    photos: { select: { id: true, url: true } },
  } as const;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pageSize = 5;
  const rawPage = Number(searchParams.get("page") || "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const skip = (page - 1) * pageSize;

  const [total, aggregate, reviews] = await Promise.all([
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { rating: true } }),
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: reviewInclude(),
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  // If the requested page is past the end, refetch the last page.
  const pageReviews =
    page > totalPages && total > 0
      ? await prisma.review.findMany({
          orderBy: { createdAt: "desc" },
          skip: (totalPages - 1) * pageSize,
          take: pageSize,
          include: reviewInclude(),
        })
      : reviews;

  return NextResponse.json({
    reviews: pageReviews,
    page: safePage,
    pageSize,
    total,
    totalPages,
    average: aggregate._avg.rating ?? 0,
  });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para dejar una reseña" }, { status: 401 });
  }
  if (user.role !== "customer") {
    return NextResponse.json(
      { error: "Solo los clientes pueden agregar reseñas" },
      { status: 403 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse({
    productId: form.get("productId"),
    rating: form.get("rating"),
    title: form.get("title") ?? "",
    comment: form.get("comment"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Datos inválidos" },
      { status: 400 }
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, active: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const fileEntries = form
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (fileEntries.length > MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Máximo ${MAX_PHOTOS} fotos por reseña` },
      { status: 400 }
    );
  }

  for (const file of fileEntries) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes JPG, PNG, WEBP o GIF" },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Cada foto debe pesar máximo 4 MB" },
        { status: 400 }
      );
    }
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");
  await mkdir(uploadDir, { recursive: true });

  const photoUrls: string[] = [];
  for (const file of fileEntries) {
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    photoUrls.push(`/uploads/reviews/${filename}`);
  }

  try {
    const review = await prisma.review.create({
      data: {
        productId: parsed.data.productId,
        userId: user.id,
        rating: parsed.data.rating,
        title: parsed.data.title || "",
        comment: parsed.data.comment,
        photos: photoUrls.length
          ? { create: photoUrls.map((url) => ({ url })) }
          : undefined,
      },
      include: reviewInclude(),
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    console.error("review create failed", err);
    return NextResponse.json(
      { error: "No se pudo guardar la reseña" },
      { status: 500 }
    );
  }
}
