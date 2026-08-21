import "dotenv/config";
import { getPrisma } from "../src/lib/db/prisma";

async function main() {
  const [productSlug] = process.argv.slice(2);
  if (!productSlug) throw new Error("Uso: npm run resource:list -- <producto>");
  const prisma = getPrisma();
  try {
    const product = await prisma.product.findUnique({ where: { slug: productSlug }, include: { resources: { orderBy: { position: "asc" } } } });
    if (!product) throw new Error("El producto no existe");
    const rows = product.resources.map(resource => ({
      título: resource.title,
      tipo: resource.type,
      estado: resource.status,
      posición: resource.position,
      tamaño: resource.fileSize?.toString() ?? "—",
      disponibilidad: resource.status === "AVAILABLE" ? "Disponible" : "No disponible",
    }));
    console.table(rows);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => { console.error(error instanceof Error ? error.message : "No se pudo listar los recursos"); process.exitCode = 1; });
