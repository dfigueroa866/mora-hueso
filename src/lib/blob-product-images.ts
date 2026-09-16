import { list } from "@vercel/blob";

export type BlobProductImage = {
  pathname: string;
  url: string;
  fileName: string;
  key: string;
};

/** Normalize product/file names for matching (accents, spaces, extension). */
export function imageMatchKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\.(jpe?g|png|webp|gif)$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const STOP = new Set([
  "con",
  "del",
  "de",
  "los",
  "las",
  "la",
  "el",
  "una",
  "un",
  "para",
  "y",
  "sabor",
  "deshidratado",
  "deshidratada",
  "deshidratados",
  "deshidratadas",
]);

function significantWords(key: string): string[] {
  return key.split(" ").filter((w) => w.length > 2 && !STOP.has(w));
}

/**
 * Strict match: prefer distinctive tokens (patitas, camote, tocino…).
 * Avoid linking every "galletas…" product to the first galletas photo.
 */
export function pickBestBlobImage(
  productName: string,
  images: BlobProductImage[]
): BlobProductImage | null {
  const productKey = imageMatchKey(productName);
  const productWords = significantWords(productKey);
  if (productWords.length === 0) return null;

  let best: BlobProductImage | null = null;
  let bestScore = 0;

  for (const image of images) {
    const fileWords = significantWords(image.key);
    if (fileWords.length === 0) continue;

    const shared = fileWords.filter((w) =>
      productWords.some(
        (p) => p === w || p.startsWith(w) || w.startsWith(p)
      )
    );

    // Soft aliases when catalog name ≠ photo filename
    const aliasHit =
      (image.key.includes("charales") &&
        (productKey.includes("charalitos") ||
          productKey.includes("charales"))) ||
      (image.key.includes("cacahuate") &&
        (productKey.includes("mani") || productKey.includes("cacahuate"))) ||
      (image.key.includes("orejas") && productKey.includes("oreja")) ||
      (image.key.includes("molleja") && productKey.includes("molleja"));

    if (shared.length === 0 && !aliasHit) continue;

    // Require covering most of the filename tokens (unless alias)
    const coverage =
      fileWords.length === 0
        ? 0
        : shared.length / fileWords.length;
    if (!aliasHit && coverage < 0.66 && shared.length < 2) continue;

    // "galletas" alone is too weak
    if (shared.length === 1 && shared[0] === "galletas") continue;

    let score = coverage * 100 + shared.length * 15;
    if (aliasHit) score += 80;

    // Bonus when a rare token matches (not just galletas/res/pollo)
    const rare = shared.filter(
      (w) => !["galletas", "res", "pollo", "cerdo", "mix", "cake"].includes(w)
    );
    score += rare.length * 25;

    if (score > bestScore) {
      best = image;
      bestScore = score;
    }
  }

  return bestScore >= 70 ? best : null;
}

export async function listProductBlobImages(
  prefix = "Products/"
): Promise<BlobProductImage[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "Falta BLOB_READ_WRITE_TOKEN. En Vercel: Storage → mora-hueso-blob → copia el token a .env (y reinicia npm run dev)"
    );
  }

  const images: BlobProductImage[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({
      prefix,
      cursor,
      limit: 1000,
      token,
    });
    for (const blob of page.blobs) {
      if (blob.pathname.endsWith("/")) continue;
      const fileName = blob.pathname.split("/").pop() || blob.pathname;
      if (!/\.(jpe?g|png|webp|gif)$/i.test(fileName)) continue;
      images.push({
        pathname: blob.pathname,
        url: blob.url,
        fileName,
        key: imageMatchKey(fileName),
      });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return images;
}
