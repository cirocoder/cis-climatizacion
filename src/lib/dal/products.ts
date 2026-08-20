import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal/auth";
import {
  findActiveEntitlement,
  findMyProducts,
  findPublishedProductBySlug,
  findUserEntitlements,
  resolvePrivateProductAccess,
} from "@/lib/catalog/access";

export async function getPublishedProductBySlug(slug: string) {
  return findPublishedProductBySlug(slug);
}

export async function getUserEntitlements() {
  const user = await requireUser();
  return findUserEntitlements(user.id);
}

export async function getMyProducts() {
  const user = await requireUser();
  return findMyProducts(user.id);
}

export async function getActiveEntitlement(productId: string) {
  const user = await requireUser();
  return findActiveEntitlement(user.id, productId);
}

export async function requireProductAccess(slug: string, returnTo: string) {
  const user = await requireUser(returnTo);
  const access = await resolvePrivateProductAccess(user.id, slug);
  if (!access) notFound();
  return { user, ...access };
}
