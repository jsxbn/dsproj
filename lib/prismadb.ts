// lib/prismadb.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // 개발 모드에서 리로딩 시 싱글톤 유지
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
