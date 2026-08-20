import { z } from "zod";
import type { PrismaClient } from "../../src/generated/prisma/client";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
const slugSchema = z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export type GrantResult = { outcome: "created" | "reactivated" | "unchanged"; entitlementId: string; email: string; slug: string };
export type RevokeResult = { outcome: "revoked" | "already_revoked" | "not_found"; entitlementId?: string; email: string; slug: string };

export function parseEntitlementArguments(email: string | undefined, slug: string | undefined) {
  return { email: emailSchema.parse(email), slug: slugSchema.parse(slug) };
}

export async function grantAdminEntitlement(
  prisma: PrismaClient,
  rawEmail: string,
  rawSlug: string,
  now = new Date(),
): Promise<GrantResult> {
  const { email, slug } = parseEntitlementArguments(rawEmail, rawSlug);
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error(`No existe un usuario con el correo ${email}.`);

  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) throw new Error(`No existe el producto ${slug}. Ejecutá el seed antes de conceder acceso.`);

  const existing = await prisma.entitlement.findUnique({
    where: { userId_productId_sourceType: { userId: user.id, productId: product.id, sourceType: "ADMIN" } },
  });

  const isAlreadyUsable = existing?.status === "ACTIVE"
    && existing.revokedAt === null
    && existing.startsAt <= now
    && (existing.expiresAt === null || existing.expiresAt > now);

  if (existing && isAlreadyUsable && existing.expiresAt === null) {
    return { outcome: "unchanged", entitlementId: existing.id, email, slug };
  }

  const entitlement = await prisma.entitlement.upsert({
    where: { userId_productId_sourceType: { userId: user.id, productId: product.id, sourceType: "ADMIN" } },
    create: {
      userId: user.id,
      productId: product.id,
      sourceType: "ADMIN",
      status: "ACTIVE",
      startsAt: now,
      expiresAt: null,
      revokedAt: null,
      reason: null,
    },
    update: {
      status: "ACTIVE",
      startsAt: now,
      expiresAt: null,
      revokedAt: null,
      reason: null,
    },
  });

  return { outcome: existing ? "reactivated" : "created", entitlementId: entitlement.id, email, slug };
}

export async function revokeAdminEntitlement(
  prisma: PrismaClient,
  rawEmail: string,
  rawSlug: string,
  now = new Date(),
): Promise<RevokeResult> {
  const { email, slug } = parseEntitlementArguments(rawEmail, rawSlug);
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!user || !product) return { outcome: "not_found", email, slug };

  const existing = await prisma.entitlement.findUnique({
    where: { userId_productId_sourceType: { userId: user.id, productId: product.id, sourceType: "ADMIN" } },
  });
  if (!existing) return { outcome: "not_found", email, slug };
  if (existing.status === "REVOKED" && existing.revokedAt !== null) {
    return { outcome: "already_revoked", entitlementId: existing.id, email, slug };
  }

  const entitlement = await prisma.entitlement.update({
    where: { id: existing.id },
    data: { status: "REVOKED", revokedAt: now, reason: "Acceso revocado manualmente" },
  });
  return { outcome: "revoked", entitlementId: entitlement.id, email, slug };
}
