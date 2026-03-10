// import { PrismaClient } from "@prisma/client";

// const globalForPrisma = global as unknown as { prisma: PrismaClient };

// export const prisma =
//     globalForPrisma.prisma ||
//     new PrismaClient({
//         log: ["query"],
//     });

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  const baseUrl = process.env.DATABASE_URL ?? "";
  const separator = baseUrl.includes("?") ? "&" : "?";
  return new PrismaClient({
    datasources: {
      db: {
        url: baseUrl + separator + "connection_limit=5&pool_timeout=30",
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

globalThis.prisma = prisma;
