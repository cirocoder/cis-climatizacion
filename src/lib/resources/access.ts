import "server-only";
import { getPrisma } from "@/lib/db/prisma";
import { findActiveEntitlement, resolvePrivateProductAccess } from "@/lib/catalog/access";

type Database = ReturnType<typeof getPrisma>;

export function toPublicResourceDto(resource: {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  mimeType: string | null;
  fileSize: bigint | null;
  downloadName: string | null;
  position: number;
}) {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    type: resource.type,
    status: resource.status,
    mimeType: resource.mimeType,
    fileSize: resource.fileSize === null ? null : Number(resource.fileSize),
    downloadName: resource.downloadName,
    position: resource.position,
  };
}

export async function findAuthorizedProductResources(userId: string, slug: string, now = new Date(), db: Database = getPrisma()) {
  const access = await resolvePrivateProductAccess(userId, slug, now, db);
  if (!access) return null;
  const resources = await db.resource.findMany({
    where: { productId: access.product.id, status: { in: ["AVAILABLE", "COMING_SOON"] } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return { ...access, resources: resources.map(toPublicResourceDto) };
}

export async function findAuthorizedAvailableResources(userId: string, slug: string, now = new Date(), db: Database = getPrisma()) {
  const result = await findAuthorizedProductResources(userId, slug, now, db);
  return result ? { ...result, resources: result.resources.filter(resource => resource.status === "AVAILABLE") } : null;
}

export async function resolveResourceAccess(userId: string, resourceId: string, now = new Date(), db: Database = getPrisma()) {
  const resource = await db.resource.findUnique({ where: { id: resourceId }, include: { product: true } });
  if (!resource || resource.status !== "AVAILABLE" || !resource.storageKey || !resource.mimeType || !resource.downloadName || resource.fileSize === null || resource.fileSize < 1) return null;
  const entitlement = await findActiveEntitlement(userId, resource.productId, now, db);
  if (!entitlement) return null;
  return {
    product: resource.product,
    entitlement,
    resource: toPublicResourceDto(resource),
    storage: { key: resource.storageKey },
  };
}
