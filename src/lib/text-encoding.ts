/**
 * Decode uploaded CSV/text without turning Spanish accents into �.
 * Excel on Windows often saves CSV as Windows-1252 (or UTF-16), not UTF-8.
 */
export function decodeUploadedText(bytes: Uint8Array): string {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes).replace(/^\uFEFF/, "");
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes).replace(/^\uFEFF/, "");
  }

  const start =
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
      ? 3
      : 0;
  const payload = start ? bytes.subarray(start) : bytes;

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(payload);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

const MOJIBAKE = /Ã.|Â[¿¡]/;

function latin1BytesAsUtf8(text: string): string {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 255) return text;
    bytes[i] = code;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

/** Keep user-facing text as NFC and undo common UTF-8/Latin-1 mojibake. */
export function preserveUserText(value: string): string {
  const text = value.normalize("NFC");
  if (!MOJIBAKE.test(text)) return text;
  try {
    return latin1BytesAsUtf8(text).normalize("NFC");
  } catch {
    return text;
  }
}

export function preserveProductText<
  T extends {
    name: string;
    description: string;
    supplier: string;
    packageSize: string;
    ingredients: string;
    nutrition: string;
  },
>(product: T): T {
  return {
    ...product,
    name: preserveUserText(product.name),
    description: preserveUserText(product.description),
    supplier: preserveUserText(product.supplier),
    packageSize: preserveUserText(product.packageSize),
    ingredients: preserveUserText(product.ingredients),
    nutrition: preserveUserText(product.nutrition),
  };
}
