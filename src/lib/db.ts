import { PrismaClient } from "@prisma-client";

const globalForPrisma = globalThis as unknown as { prismaV2?: PrismaClient };

export const prisma =
  globalForPrisma.prismaV2 ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaV2 = prisma;
