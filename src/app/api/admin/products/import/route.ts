import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validators";
import { parseCsv, rowsToObjects } from "@/lib/csv-products";

function getUploadName(value: Blob): string {
  if ("name" in value && typeof (value as { name?: unknown }).name === "string") {
    return (value as { name: string }).name;
  }
  return "upload.csv";
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let text = "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const entry = form.get("file");

      if (!entry || typeof entry === "string") {
        return NextResponse.json(
          { error: "Adjunta un archivo CSV en el campo file" },
          { status: 400 }
        );
      }

      // Node 18 may not expose global File; treat upload as Blob
      const blob = entry as Blob;
      const fileName = getUploadName(blob).toLowerCase();
      if (!fileName.endsWith(".csv")) {
        return NextResponse.json(
          { error: "Solo se permiten archivos .csv" },
          { status: 400 }
        );
      }

      text = await blob.text();
    } else {
      text = await req.text();
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "El archivo está vacío" },
        { status: 400 }
      );
    }

    let rows: ReturnType<typeof rowsToObjects>;
    try {
      rows = rowsToObjects(parseCsv(text));
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "CSV inválido" },
        { status: 400 }
      );
    }

    const created: string[] = [];
    const updated: string[] = [];
    const errors: { row: number; sku?: string; error: string }[] = [];

    for (const { row, data } of rows) {
      const sku = (data.sku || "").trim();
      try {
        let nutrition = (data.nutrition || "").trim();
        if (nutrition && !nutrition.startsWith("{")) {
          const parts = nutrition.split(";").filter(Boolean);
          const obj: Record<string, string> = {};
          for (const part of parts) {
            const [k, ...rest] = part.split(":");
            if (k && rest.length) obj[k.trim()] = rest.join(":").trim();
          }
          nutrition = JSON.stringify(obj);
        }
        if (!nutrition) {
          nutrition = JSON.stringify({
            protein: "0%",
            fat: "0%",
            fiber: "0%",
            moisture: "0%",
            ash: "0%",
          });
        }

        // Normalize common Excel decimal commas
        const priceRaw = (data.price || "").replace(",", ".");
        const stockRaw = (data.stock || "").replace(",", ".");
        const lowStockRaw = (data.lowStockAt || "").replace(",", ".");

        const parsed = productSchema.safeParse({
          name: data.name?.trim(),
          description: data.description?.trim(),
          price: Number(priceRaw),
          category: data.category?.trim().toLowerCase(),
          stock: Number(stockRaw),
          sku,
          supplier: data.supplier?.trim(),
          packageSize: data.packageSize?.trim(),
          ingredients: data.ingredients?.trim(),
          nutrition,
          image: data.image?.trim(),
          lowStockAt:
            lowStockRaw !== "" ? Number(lowStockRaw) : 10,
          active: true,
        });

        if (!parsed.success) {
          const fieldErrors = parsed.error.flatten().fieldErrors;
          const first =
            Object.entries(fieldErrors)
              .map(([k, v]) => `${k}: ${v?.[0]}`)
              .find(Boolean) || "Datos inválidos";
          errors.push({ row, sku, error: first });
          continue;
        }

        const existing = await prisma.product.findUnique({ where: { sku } });
        if (existing) {
          await prisma.product.update({
            where: { sku },
            data: { ...parsed.data, active: true },
          });
          updated.push(sku);
        } else {
          await prisma.product.create({ data: parsed.data });
          created.push(sku);
        }
      } catch (e) {
        errors.push({
          row,
          sku,
          error: e instanceof Error ? e.message : "Error al guardar",
        });
      }
    }

    return NextResponse.json({
      ok: errors.length === 0,
      created: created.length,
      updated: updated.length,
      failed: errors.length,
      createdSkus: created,
      updatedSkus: updated,
      errors,
    });
  } catch (e) {
    console.error("[CSV import]", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? `Error al importar: ${e.message}`
            : "Error interno al importar",
      },
      { status: 500 }
    );
  }
}
