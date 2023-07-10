import { PrismaClient } from "@prisma/client";
import { env } from "~/env.cjs";
import { otelSetup } from "~/server/db/setup";

// This is a helper function that instantiates Prisma
const instantiatePrisma = () => {
  const prisma = new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  // Register OpenTelemetry
  otelSetup();

  // Add middleware to handle soft deletes
  // Comment this out to disable soft deletes
  // prisma.$use(softDeleteChangeFind);
  // prisma.$use(softDeleteChangeUpdate);
  // prisma.$use(softDeleteChangeDelete);

  // Add middleware to handle optimistic concurrency control
  // Comment this out to disable optimistic concurrency control
  // prisma.$use(versioningChangeUpdate);

  return prisma;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? instantiatePrisma();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
