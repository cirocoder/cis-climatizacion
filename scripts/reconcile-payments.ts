import { getPrisma } from "../src/lib/db/prisma";
import { getMercadoPagoEnvironment } from "../src/lib/env/server";
import { createMercadoPagoGateway } from "../src/lib/payments/mercadopago";
import { reconcilePendingPurchases } from "../src/services/purchases";

const environment = getMercadoPagoEnvironment();
const prisma = getPrisma();

try {
  const results = await reconcilePendingPurchases({
    gateway: createMercadoPagoGateway(environment),
    expectedCollectorId: environment.MERCADOPAGO_COLLECTOR_ID,
    db: prisma,
  });
  process.stdout.write(`Reconciliación completada: ${results.length} compra(s) revisada(s).\n`);
} finally {
  await prisma.$disconnect();
}
