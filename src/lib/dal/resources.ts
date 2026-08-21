import "server-only";
import { getCurrentUser } from "@/lib/dal/auth";
import { getPrisma } from "@/lib/db/prisma";
import { findAuthorizedAvailableResources, findAuthorizedProductResources, resolveResourceAccess, toPublicResourceDto } from "@/lib/resources/access";

export class ResourceAccessError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "NOT_FOUND", public userId: string | null = null) {
    super(code === "UNAUTHENTICATED" ? "Sesión requerida" : "Recurso no disponible");
  }
}

export async function getProductResources(slug: string) {
  const user = await getCurrentUser();
  if (!user) throw new ResourceAccessError("UNAUTHENTICATED");
  const result = await findAuthorizedProductResources(user.id, slug);
  if (!result) throw new ResourceAccessError("NOT_FOUND", user.id);
  return result;
}

export async function getAvailableProductResources(slug: string) {
  const user = await getCurrentUser();
  if (!user) throw new ResourceAccessError("UNAUTHENTICATED");
  const result = await findAuthorizedAvailableResources(user.id, slug);
  if (!result) throw new ResourceAccessError("NOT_FOUND", user.id);
  return result;
}

export async function getResourceById(resourceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new ResourceAccessError("UNAUTHENTICATED");
  const db = getPrisma();
  const resource = await db.resource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new ResourceAccessError("NOT_FOUND", user.id);
  const access = await findAuthorizedProductResources(user.id, (await db.product.findUniqueOrThrow({ where: { id: resource.productId } })).slug);
  if (!access || !access.resources.some(item => item.id === resourceId)) throw new ResourceAccessError("NOT_FOUND", user.id);
  return toPublicResourceDto(resource);
}

export async function requireResourceAccess(resourceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new ResourceAccessError("UNAUTHENTICATED");
  const access = await resolveResourceAccess(user.id, resourceId);
  if (!access) throw new ResourceAccessError("NOT_FOUND", user.id);
  return { user, ...access };
}
