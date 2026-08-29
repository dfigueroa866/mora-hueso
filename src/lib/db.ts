import { PrismaClient } from "@prisma-client";

const databaseUrl = process.env.DATABASE_URL ?? "";
if (databaseUrl.startsWith("file:")) {
  throw new Error(
    "SQLite no funciona en Vercel. Configura DATABASE_URL con PostgreSQL (Neon)."
  );
}

const globalForPrisma = globalThis as unknown as { prismaV2?: PrismaClient };

export const prisma =
  globalForPrisma.prismaV2 ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaV2 = prisma;
