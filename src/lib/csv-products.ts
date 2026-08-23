export const PRODUCT_CSV_HEADERS = [
  "name",
  "description",
  "price",
  "category",
  "stock",
  "sku",
  "supplier",
  "packageSize",
  "ingredients",
  "nutrition",
  "image",
  "lowStockAt",
] as const;

export type ProductCsvHeader = (typeof PRODUCT_CSV_HEADERS)[number];

export const PRODUCT_CSV_EXAMPLE_ROW = [
  "Galletas de Ejemplo",
  "Galletas horneadas con ingredientes naturales para premios diarios.",
  "129",
  "galletas",
  "25",
  "MH-EJEMPLO-001",
  "Proveedor Demo",
  "200 g",
  "avena, calabaza, huevo",
  '{"protein":"14%","fat":"8%","fiber":"6%","moisture":"8%","ash":"4%"}',
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80",
  "10",
];

/** Escape a CSV field (quotes + commas + newlines). */
export function escapeCsvField(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildProductCsvTemplate() {
  const header = PRODUCT_CSV_HEADERS.join(",");
  const row = PRODUCT_CSV_EXAMPLE_ROW.map(escapeCsvField).join(",");
  return `${header}\n${row}\n`;
}

function detectDelimiter(text: string): "," | ";" {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim()) || "";
  let commas = 0;
  let semis = 0;
  let inQuotes = false;
  for (let i = 0; i < firstLine.length; i++) {
    const c = firstLine[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (c === ",") commas++;
    if (c === ";") semis++;
  }
  return semis > commas ? ";" : ",";
}

/** Parse CSV text into rows of string arrays (supports quoted fields). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const input = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(input);

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field.trim());
      field = "";
    } else if (char === "\n") {
      row.push(field.trim());
      field = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
    } else if (char === "\r") {
      // ignore CR
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);

  return rows;
}

export function rowsToObjects(rows: string[][]) {
  if (rows.length < 2) {
    throw new Error("El CSV debe incluir encabezados y al menos una fila.");
  }

  const headers = rows[0].map((h) => h.trim());
  const missing = PRODUCT_CSV_HEADERS.filter(
    (h) => h !== "lowStockAt" && !headers.includes(h)
  );
  if (missing.length > 0) {
    throw new Error(`Faltan columnas: ${missing.join(", ")}`);
  }

  return rows.slice(1).map((cols, index) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? "";
    });
    return { row: index + 2, data: obj };
  });
}
