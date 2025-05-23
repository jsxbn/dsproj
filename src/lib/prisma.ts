import { PrismaClient } from "@prisma/client";

// eslint-disable-next-line prefer-const
let globalWithPrisma = global as typeof globalThis & {
  prisma: PrismaClient;
};

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient();
  }
  prisma = globalWithPrisma.prisma;
}

export default prisma;
