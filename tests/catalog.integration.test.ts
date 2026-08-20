import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const requireUserMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/dal/auth", () => ({ requireUser: requireUserMock }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("PRODUCT_NOT_FOUND"); } }));

describe("Sprint 2: catálogo y autorización", () => {
  const suffix = randomUUID().slice(0, 8);
  const emails = {
    userA: `catalog-a-${suffix}@example.com`,
    userB: `catalog-b-${suffix}@example.com`,
    manual: `catalog-manual-${suffix}@example.com`,
    empty: `catalog-empty-${suffix}@example.com`,
  };
  const now = new Date("2026-08-20T15:00:00.000Z");
  const draftSlug = `catalog-draft-${suffix}`;
  let prisma: ReturnType<typeof import("../src/lib/db/prisma")["getPrisma"]>;
  let productId = "";
  let users: Record<keyof typeof emails, string>;

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET = "test-only-secret-with-at-least-thirty-two-characters";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.APP_URL = "http://localhost:3000";
    const [{ getPrisma }, { seedAcademyProducts }, access] = await Promise.all([
      import("../src/lib/db/prisma"),
      import("../prisma/seed-data"),
      import("../src/lib/catalog/access"),
    ]);
    void access;
    prisma = getPrisma();
    await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
    await prisma.product.deleteMany({ where: { slug: draftSlug } });
    const product = await seedAcademyProducts(prisma);
    productId = product.id;
    const entries = await Promise.all(Object.entries(emails).map(async ([key, email]) => {
      const user = await prisma.user.create({ data: { id: randomUUID(), name: `Usuario ${key}`, email, emailVerified: true } });
      return [key, user.id] as const;
    }));
    users = Object.fromEntries(entries) as typeof users;
    await prisma.product.create({ data: { slug: draftSlug, title: "Producto interno de prueba", description: "Sólo existe en la base local de tests.", type: "KIT", status: "DRAFT", accessType: "ONE_TIME" } });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
    await prisma.product.deleteMany({ where: { slug: draftSlug } });
    await prisma.$disconnect();
  });

  async function setAdminEntitlement(userId: string, data: { status: "ACTIVE" | "SUSPENDED" | "REVOKED" | "EXPIRED"; startsAt?: Date; expiresAt?: Date | null; revokedAt?: Date | null }) {
    return prisma.entitlement.upsert({
      where: { userId_productId_sourceType: { userId, productId, sourceType: "ADMIN" } },
      create: { userId, productId, sourceType: "ADMIN", status: data.status, startsAt: data.startsAt ?? new Date(now.getTime() - 60_000), expiresAt: data.expiresAt ?? null, revokedAt: data.revokedAt ?? null },
      update: { status: data.status, startsAt: data.startsAt ?? new Date(now.getTime() - 60_000), expiresAt: data.expiresAt ?? null, revokedAt: data.revokedAt ?? null },
    });
  }

  it("1. encuentra un producto publicado por slug", async () => {
    const { findPublishedProductBySlug } = await import("../src/lib/catalog/access");
    expect((await findPublishedProductBySlug("kit-cis-5p", prisma))?.id).toBe(productId);
  });

  it("2. devuelve null para un producto inexistente", async () => {
    const { findPublishedProductBySlug } = await import("../src/lib/catalog/access");
    expect(await findPublishedProductBySlug("producto-inexistente", prisma)).toBeNull();
  });

  it("3. no trata un producto DRAFT como publicado", async () => {
    const { findPublishedProductBySlug } = await import("../src/lib/catalog/access");
    expect(await findPublishedProductBySlug(draftSlug, prisma)).toBeNull();
  });

  it("4. rechaza a un usuario sin entitlement", async () => {
    const { resolvePrivateProductAccess } = await import("../src/lib/catalog/access");
    expect(await resolvePrivateProductAccess(users.empty, "kit-cis-5p", now, prisma)).toBeNull();
  });

  it("5. admite un entitlement ACTIVE dentro de su vigencia", async () => {
    const { resolvePrivateProductAccess } = await import("../src/lib/catalog/access");
    await setAdminEntitlement(users.userA, { status: "ACTIVE" });
    expect((await resolvePrivateProductAccess(users.userA, "kit-cis-5p", now, prisma))?.entitlement.status).toBe("ACTIVE");
  });

  it("6. rechaza un entitlement SUSPENDED", async () => {
    const { resolvePrivateProductAccess } = await import("../src/lib/catalog/access");
    await setAdminEntitlement(users.userA, { status: "SUSPENDED" });
    expect(await resolvePrivateProductAccess(users.userA, "kit-cis-5p", now, prisma)).toBeNull();
  });

  it("7. rechaza un entitlement REVOKED", async () => {
    const { resolvePrivateProductAccess } = await import("../src/lib/catalog/access");
    await setAdminEntitlement(users.userA, { status: "REVOKED", revokedAt: new Date(now.getTime() - 1_000) });
    expect(await resolvePrivateProductAccess(users.userA, "kit-cis-5p", now, prisma)).toBeNull();
  });

  it("8. rechaza un entitlement ACTIVE cuya expiración pasó", async () => {
    const { resolvePrivateProductAccess } = await import("../src/lib/catalog/access");
    await setAdminEntitlement(users.userA, { status: "ACTIVE", expiresAt: new Date(now.getTime() - 1_000) });
    expect(await resolvePrivateProductAccess(users.userA, "kit-cis-5p", now, prisma)).toBeNull();
  });

  it("9. rechaza un entitlement ACTIVE que todavía no comenzó", async () => {
    const { resolvePrivateProductAccess } = await import("../src/lib/catalog/access");
    await setAdminEntitlement(users.userA, { status: "ACTIVE", startsAt: new Date(now.getTime() + 60_000) });
    expect(await resolvePrivateProductAccess(users.userA, "kit-cis-5p", now, prisma)).toBeNull();
  });

  it("10. no usa el entitlement de otro usuario", async () => {
    const { resolvePrivateProductAccess } = await import("../src/lib/catalog/access");
    await setAdminEntitlement(users.userB, { status: "ACTIVE" });
    expect(await resolvePrivateProductAccess(users.empty, "kit-cis-5p", now, prisma)).toBeNull();
  });

  it("11. el grant manual crea acceso administrativo", async () => {
    const { grantAdminEntitlement } = await import("../scripts/lib/entitlements");
    const result = await grantAdminEntitlement(prisma, emails.manual, "kit-cis-5p", now);
    expect(result.outcome).toBe("created");
    expect(await prisma.entitlement.count({ where: { userId: users.manual, productId, sourceType: "ADMIN" } })).toBe(1);
  });

  it("12. el grant repetido es idempotente", async () => {
    const { grantAdminEntitlement } = await import("../scripts/lib/entitlements");
    const result = await grantAdminEntitlement(prisma, emails.manual, "kit-cis-5p", now);
    expect(result.outcome).toBe("unchanged");
    expect(await prisma.entitlement.count({ where: { userId: users.manual, productId, sourceType: "ADMIN" } })).toBe(1);
  });

  it("13. el revoke manual corta el acceso inmediatamente", async () => {
    const [{ revokeAdminEntitlement }, { resolvePrivateProductAccess }] = await Promise.all([import("../scripts/lib/entitlements"), import("../src/lib/catalog/access")]);
    expect((await revokeAdminEntitlement(prisma, emails.manual, "kit-cis-5p", now)).outcome).toBe("revoked");
    expect(await resolvePrivateProductAccess(users.manual, "kit-cis-5p", new Date(now.getTime() + 1), prisma)).toBeNull();
  });

  it("14. el revoke repetido es idempotente", async () => {
    const { revokeAdminEntitlement } = await import("../scripts/lib/entitlements");
    expect((await revokeAdminEntitlement(prisma, emails.manual, "kit-cis-5p", now)).outcome).toBe("already_revoked");
  });

  it("15. Mi Academia lista sólo productos autorizados y utilizables", async () => {
    const { findMyProducts } = await import("../src/lib/catalog/access");
    await setAdminEntitlement(users.userA, { status: "ACTIVE" });
    const products = await findMyProducts(users.userA, now, prisma);
    expect(products.map(item => item.product.slug)).toEqual(["kit-cis-5p"]);
    expect(await findMyProducts(users.empty, now, prisma)).toEqual([]);
  });

  it("16. la ruta privada responde como no disponible sin acceso", async () => {
    const { requireProductAccess } = await import("../src/lib/dal/products");
    requireUserMock.mockResolvedValueOnce({ id: users.empty });
    await expect(requireProductAccess("kit-cis-5p", "/academia/mi-academia/productos/kit-cis-5p")).rejects.toThrow("PRODUCT_NOT_FOUND");
  });

  it("17. la ruta privada permite al usuario autorizado", async () => {
    const { requireProductAccess } = await import("../src/lib/dal/products");
    await setAdminEntitlement(users.userA, { status: "ACTIVE", startsAt: new Date(Date.now() - 60_000) });
    requireUserMock.mockResolvedValueOnce({ id: users.userA, email: emails.userA });
    const access = await requireProductAccess("kit-cis-5p", "/academia/mi-academia/productos/kit-cis-5p");
    expect(access.product.slug).toBe("kit-cis-5p");
    expect(access.user.id).toBe(users.userA);
  });

  it("18. la ruta privada conserva la redirección a login para anónimos", async () => {
    const { requireProductAccess } = await import("../src/lib/dal/products");
    requireUserMock.mockRejectedValueOnce(new Error("REDIRECT:/ingresar?callbackUrl=%2Facademia%2Fmi-academia%2Fproductos%2Fkit-cis-5p"));
    await expect(requireProductAccess("kit-cis-5p", "/academia/mi-academia/productos/kit-cis-5p")).rejects.toThrow("REDIRECT:/ingresar");
  });
});
