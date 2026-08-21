import "server-only";
import type { KitVideoResourceAlias } from "@/data/resources";
import { getKitResourceDefinition } from "@/data/resources";
import { getPrisma } from "@/lib/db/prisma";
import { findAuthorizedProductResources } from "@/lib/resources/access";

type Database = ReturnType<typeof getPrisma>;

export async function resolveKitResourcePortal(userId: string | null, now = new Date(), db: Database = getPrisma()) {
  if (!userId) return { state: "ANONYMOUS" as const, access: null };
  const access = await findAuthorizedProductResources(userId, "kit-cis-5p", now, db);
  return access
    ? { state: "AUTHORIZED" as const, access }
    : { state: "COMMERCIAL" as const, access: null };
}

export async function resolveKitVideoResourcePortal(userId: string, alias: KitVideoResourceAlias, now = new Date(), db: Database = getPrisma()) {
  const definition = getKitResourceDefinition(alias);
  if (!definition || definition.type !== "VIDEO") return { state: "UNAVAILABLE" as const, resource: null };
  const access = await findAuthorizedProductResources(userId, "kit-cis-5p", now, db);
  if (!access) return { state: "NO_ACCESS" as const, resource: null };
  const resource = access.resources.find(item => item.type === "VIDEO" && item.title === definition.title) ?? null;
  return resource
    ? { state: "AUTHORIZED" as const, resource, entitlement: access.entitlement }
    : { state: "UNAVAILABLE" as const, resource: null };
}
