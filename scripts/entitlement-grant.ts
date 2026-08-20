import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { createPostgresAdapter } from "../src/lib/db/adapter";
import { grantAdminEntitlement, parseEntitlementArguments } from "./lib/entitlements";

async function main() {
  const { email, slug } = parseEntitlementArguments(process.argv[2], process.argv[3]);
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está configurada.");
  const prisma = new PrismaClient({ adapter: createPostgresAdapter(connectionString) });
  try {
    const result = await grantAdminEntitlement(prisma, email, slug);
    const message = result.outcome === "created" ? "Acceso concedido" : result.outcome === "reactivated" ? "Acceso reactivado" : "El acceso ya estaba activo";
    process.stdout.write(`${message}: ${result.email} → ${result.slug}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => { process.stderr.write(`${error instanceof Error ? error.message : "No se pudo conceder el acceso."}\n`); process.exitCode = 1; });
