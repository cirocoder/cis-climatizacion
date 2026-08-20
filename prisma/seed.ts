import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { createPostgresAdapter } from "../src/lib/db/adapter";
import { seedAcademyProducts } from "./seed-data";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está configurada.");

  const prisma = new PrismaClient({ adapter: createPostgresAdapter(connectionString) });
  try {
    const product = await seedAcademyProducts(prisma);
    process.stdout.write(`Producto preparado: ${product.slug}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : "No se pudo ejecutar el seed."}\n`);
  process.exitCode = 1;
});
