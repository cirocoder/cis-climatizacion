import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { createPostgresAdapter } from "@/lib/db/adapter";
import { getAuthEnvironment } from "@/lib/env/server";

const globalForPrisma = globalThis as unknown as { cisPrisma?: PrismaClient };

export function getPrisma() {
  if (globalForPrisma.cisPrisma) return globalForPrisma.cisPrisma;

  const { DATABASE_URL } = getAuthEnvironment();
  const adapter = createPostgresAdapter(DATABASE_URL);
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") globalForPrisma.cisPrisma = client;
  return client;
}
