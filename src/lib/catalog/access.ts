import "server-only";
import { getPrisma } from "@/lib/db/prisma";

type Database = ReturnType<typeof getPrisma>;

function usableEntitlementWhere(now: Date) {
  return {
    status: "ACTIVE" as const,
    startsAt: { lte: now },
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

export async function findPublishedProductBySlug(slug: string, db: Database = getPrisma()) {
  return db.product.findFirst({ where: { slug, status: "PUBLISHED" } });
}

export async function findUserEntitlements(userId: string, now = new Date(), db: Database = getPrisma()) {
  return db.entitlement.findMany({
    where: { userId, ...usableEntitlementWhere(now), product: { status: "PUBLISHED" } },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function findMyProducts(userId: string, now = new Date(), db: Database = getPrisma()) {
  const entitlements = await findUserEntitlements(userId, now, db);
  const products = new Map<string, (typeof entitlements)[number]>();

  for (const entitlement of entitlements) {
    const current = products.get(entitlement.productId);
    if (!current || current.expiresAt !== null && (
      entitlement.expiresAt === null || entitlement.expiresAt > current.expiresAt
    )) products.set(entitlement.productId, entitlement);
  }

  return [...products.values()];
}

export async function findActiveEntitlement(
  userId: string,
  productId: string,
  now = new Date(),
  db: Database = getPrisma(),
) {
  return db.entitlement.findFirst({
    where: { userId, productId, ...usableEntitlementWhere(now), product: { status: "PUBLISHED" } },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function resolvePrivateProductAccess(
  userId: string,
  slug: string,
  now = new Date(),
  db: Database = getPrisma(),
) {
  const product = await findPublishedProductBySlug(slug, db);
  if (!product) return null;
  const entitlement = await findActiveEntitlement(userId, product.id, now, db);
  return entitlement ? { product, entitlement } : null;
}
