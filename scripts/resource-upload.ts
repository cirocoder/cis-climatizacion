import "dotenv/config";
import { getPrisma } from "../src/lib/db/prisma";
import { createR2Storage } from "../src/lib/storage/r2";
import { uploadProductResource } from "./lib/resources";

async function main() {
  const [productSlug, alias, filePath] = process.argv.slice(2);
  if (!productSlug || !alias || !filePath) throw new Error("Uso: npm run resource:upload -- <producto> <alias> <archivo>");
  const prisma = getPrisma();
  try {
    const result = await uploadProductResource({ db: prisma, storage: createR2Storage(), productSlug, alias, filePath });
    process.stdout.write(`Recurso disponible: ${result.resource.title} (${result.resource.fileSize?.toString() ?? "0"} bytes).\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => { console.error(error instanceof Error ? error.message : "No se pudo subir el recurso"); process.exitCode = 1; });
