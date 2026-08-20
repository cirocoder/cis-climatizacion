import { createHmac, randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUserMock = vi.hoisted(() => vi.fn());
const createGatewayMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/dal/auth", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/dal/auth")>(),
  getCurrentUser: getCurrentUserMock,
}));
vi.mock("@/lib/env/server", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/env/server")>(),
  getMercadoPagoEnvironment: () => ({
    MERCADOPAGO_ACCESS_TOKEN: "TEST-token",
    MERCADOPAGO_WEBHOOK_SECRET: "test-webhook-secret",
    MERCADOPAGO_COLLECTOR_ID: "collector-123",
    MERCADOPAGO_ENVIRONMENT: "TEST" as const,
    APP_URL: "https://preview.example.test",
  }),
}));
vi.mock("@/lib/payments/mercadopago", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/payments/mercadopago")>(),
  createMercadoPagoGateway: createGatewayMock,
}));

describe("Sprint 3: compra única con Mercado Pago", () => {
  const suffix = randomUUID().slice(0, 8);
  const emails = {
    userA: `payments-a-${suffix}@example.com`,
    userB: `payments-b-${suffix}@example.com`,
    owner: `payments-owner-${suffix}@example.com`,
  };
  const now = new Date("2026-08-20T18:00:00.000Z");
  const draftSlug = `payments-draft-${suffix}`;
  let prisma: ReturnType<typeof import("../src/lib/db/prisma")["getPrisma"]>;
  let productId = "";
  let users: Record<keyof typeof emails, string>;
  let preferenceSequence = 0;

  const gateway = {
    createPreference: vi.fn(async () => {
      preferenceSequence += 1;
      return { id: `pref-${suffix}-${preferenceSequence}`, checkoutUrl: `https://sandbox.mercadopago.test/${preferenceSequence}` };
    }),
    getPayment: vi.fn(),
  };

  beforeAll(async () => {
    process.env.BETTER_AUTH_SECRET = "test-only-secret-with-at-least-thirty-two-characters";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.APP_URL = "http://localhost:3000";
    const [{ getPrisma }, { seedAcademyProducts }] = await Promise.all([
      import("../src/lib/db/prisma"),
      import("../prisma/seed-data"),
    ]);
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
    await prisma.product.create({ data: { slug: draftSlug, title: "Producto draft de prueba", description: "No publicable", type: "KIT", status: "DRAFT", accessType: "ONE_TIME", price: "12500.00", currency: "ARS" } });
  });

  beforeEach(async () => {
    gateway.createPreference.mockClear();
    gateway.getPayment.mockReset();
    createGatewayMock.mockReturnValue(gateway);
    getCurrentUserMock.mockReset();
    await prisma.purchase.deleteMany({ where: { userId: { in: Object.values(users) } } });
    await prisma.entitlement.deleteMany({ where: { userId: { in: Object.values(users) }, sourceType: "PURCHASE" } });
    await prisma.product.update({ where: { id: productId }, data: { status: "PUBLISHED", price: "12500.00", currency: "ARS" } });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.purchase.deleteMany({ where: { userId: { in: Object.values(users) } } });
    await prisma.entitlement.deleteMany({ where: { userId: { in: Object.values(users) }, sourceType: "PURCHASE" } });
    await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
    await prisma.product.deleteMany({ where: { slug: draftSlug } });
    await prisma.product.update({ where: { id: productId }, data: { price: null } });
    await prisma.$disconnect();
  });

  async function checkout(userId = users.userA, slug = "kit-cis-5p") {
    const { createCheckout } = await import("../src/services/purchases");
    return createCheckout({ userId, slug, appUrl: "https://preview.example.test", gateway, now, db: prisma });
  }

  function providerPayment(purchase: Awaited<ReturnType<typeof checkout>>["purchase"], overrides: Record<string, unknown> = {}) {
    return {
      id: `payment-${purchase.id}`,
      status: "approved",
      externalReference: purchase.externalReference,
      transactionAmount: purchase.total.toFixed(2),
      currency: purchase.currency,
      collectorId: "collector-123",
      dateApproved: now,
      amountRefunded: "0",
      ...overrides,
    };
  }

  async function notify(purchase: Awaited<ReturnType<typeof checkout>>["purchase"], payment: ReturnType<typeof providerPayment>, eventId: string = randomUUID()) {
    const { processPaymentNotification } = await import("../src/services/purchases");
    gateway.getPayment.mockResolvedValueOnce(payment);
    return processPaymentNotification({
      db: prisma,
      gateway,
      expectedCollectorId: "collector-123",
      now,
      event: { providerEventId: eventId, eventType: "payment.updated", providerResourceId: payment.id, payload: { type: "payment" } },
    });
  }

  it("1. rechaza checkout sin sesión", async () => {
    getCurrentUserMock.mockResolvedValueOnce(null);
    const { POST } = await import("../src/app/api/checkout/mercadopago/route");
    const response = await POST(new Request("https://preview.example.test/api/checkout/mercadopago", { method: "POST", body: JSON.stringify({ slug: "kit-cis-5p" }) }));
    expect(response.status).toBe(401);
    expect(await prisma.purchase.count({ where: { userId: users.userA } })).toBe(0);
  });

  it("2. rechaza producto inexistente", async () => {
    await expect(checkout(users.userA, "inexistente")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("3. rechaza producto DRAFT", async () => {
    await expect(checkout(users.userA, draftSlug)).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });

  it("4. no inicia checkout si el producto no tiene precio", async () => {
    await prisma.product.update({ where: { id: productId }, data: { price: null } });
    await expect(checkout()).rejects.toMatchObject({ code: "NO_PRICE" });
  });

  it("5. ignora un precio agregado por el cliente", async () => {
    const { createCheckout } = await import("../src/services/purchases");
    const requestWithClientPrice = { userId: users.userA, slug: "kit-cis-5p", appUrl: "https://preview.example.test", gateway, now, db: prisma, price: "1.00" };
    const result = await createCheckout(requestWithClientPrice);
    expect(result.purchase.total.toFixed(2)).toBe("12500.00");
    expect(result.purchase.items[0].unitPrice.toFixed(2)).toBe("12500.00");
  });

  it("6. impide recomprar cuando ya existe entitlement activo", async () => {
    await prisma.entitlement.create({ data: { userId: users.owner, productId, sourceType: "ADMIN", status: "ACTIVE", startsAt: new Date(now.getTime() - 1_000) } });
    await expect(checkout(users.owner)).rejects.toMatchObject({ code: "ALREADY_OWNED" });
    await prisma.entitlement.deleteMany({ where: { userId: users.owner, productId, sourceType: "ADMIN" } });
  });

  it("7. crea Purchase en estado CREATED", async () => {
    const result = await checkout();
    expect(result.purchase.status).toBe("CREATED");
    expect(result.purchase.userId).toBe(users.userA);
    expect(result.purchase.providerPreferenceId).toMatch(/^pref-/);
  });

  it("8. conserva snapshot correcto en PurchaseItem", async () => {
    const result = await checkout();
    expect(result.purchase.items).toHaveLength(1);
    expect(result.purchase.items[0]).toMatchObject({ productId, quantity: 1 });
    expect(result.purchase.items[0].productTitleSnapshot).toContain("Kit CIS 5P");
    expect(result.purchase.items[0].subtotal.toFixed(2)).toBe("12500.00");
  });

  it("9. genera externalReference única y no sensible", async () => {
    const first = await checkout(users.userA);
    const second = await checkout(users.userB);
    expect(first.purchase.externalReference).not.toBe(second.purchase.externalReference);
    expect(first.purchase.externalReference).toMatch(/^cis_purchase_[\da-f-]+$/);
    expect(first.purchase.externalReference).not.toContain(emails.userA);
  });

  it("10. el endpoint de webhook rechaza una firma inválida", async () => {
    const { POST } = await import("../src/app/api/webhooks/mercadopago/route");
    const response = await POST(new Request("https://preview.example.test/api/webhooks/mercadopago?data.id=123", {
      method: "POST",
      headers: { "content-type": "application/json", "x-request-id": "request-1", "x-signature": "ts=1,v1=" + "0".repeat(64) },
      body: JSON.stringify({ id: "event-1", type: "payment", data: { id: "123" } }),
    }));
    expect(response.status).toBe(401);
    expect(gateway.getPayment).not.toHaveBeenCalled();
  });

  it("11. procesa un webhook approved válido", async () => {
    const created = await checkout();
    const payment = providerPayment(created.purchase);
    gateway.getPayment.mockResolvedValueOnce(payment);
    const eventId = `valid-event-${suffix}`;
    const requestId = `request-${suffix}`;
    const timestamp = "1787250000";
    const digest = createHmac("sha256", "test-webhook-secret").update(`id:${payment.id.toLowerCase()};request-id:${requestId};ts:${timestamp};`).digest("hex");
    const { POST } = await import("../src/app/api/webhooks/mercadopago/route");
    const response = await POST(new Request(`https://preview.example.test/api/webhooks/mercadopago?data.id=${payment.id}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-request-id": requestId, "x-signature": `ts=${timestamp},v1=${digest}` },
      body: JSON.stringify({ id: eventId, type: "payment", action: "payment.updated", live_mode: false, data: { id: payment.id } }),
    }));
    expect(response.status).toBe(200);
    expect((await prisma.purchase.findUniqueOrThrow({ where: { id: created.purchase.id } })).status).toBe("APPROVED");
  });

  it("12. mapea pending sin conceder acceso", async () => {
    const created = await checkout();
    await notify(created.purchase, providerPayment(created.purchase, { status: "pending" }));
    expect((await prisma.purchase.findUniqueOrThrow({ where: { id: created.purchase.id } })).status).toBe("PENDING");
    expect(await prisma.entitlement.count({ where: { userId: users.userA, sourceType: "PURCHASE" } })).toBe(0);
  });

  it("13. mapea rejected sin conceder acceso", async () => {
    const created = await checkout();
    await notify(created.purchase, providerPayment(created.purchase, { status: "rejected" }));
    expect((await prisma.purchase.findUniqueOrThrow({ where: { id: created.purchase.id } })).status).toBe("REJECTED");
    expect(await prisma.entitlement.count({ where: { userId: users.userA, sourceType: "PURCHASE" } })).toBe(0);
  });

  it("14. mapea cancelled sin conceder acceso", async () => {
    const created = await checkout();
    await notify(created.purchase, providerPayment(created.purchase, { status: "cancelled" }));
    expect((await prisma.purchase.findUniqueOrThrow({ where: { id: created.purchase.id } })).status).toBe("CANCELLED");
    expect(await prisma.entitlement.count({ where: { userId: users.userA, sourceType: "PURCHASE" } })).toBe(0);
  });

  it("15. mapea refunded", async () => {
    const created = await checkout();
    await notify(created.purchase, providerPayment(created.purchase, { status: "refunded", amountRefunded: "12500.00" }));
    expect((await prisma.purchase.findUniqueOrThrow({ where: { id: created.purchase.id } })).status).toBe("REFUNDED");
  });

  it("16. approved crea un entitlement PURCHASE permanente", async () => {
    const created = await checkout();
    await notify(created.purchase, providerPayment(created.purchase));
    const entitlement = await prisma.entitlement.findUniqueOrThrow({ where: { userId_productId_sourceType: { userId: users.userA, productId, sourceType: "PURCHASE" } } });
    expect(entitlement).toMatchObject({ status: "ACTIVE", sourceId: created.purchase.id, expiresAt: null, revokedAt: null });
  });

  it("17. dos notificaciones approved no duplican entitlement", async () => {
    const created = await checkout();
    const payment = providerPayment(created.purchase);
    await notify(created.purchase, payment, `event-a-${suffix}`);
    await notify(created.purchase, payment, `event-b-${suffix}`);
    expect(await prisma.entitlement.count({ where: { userId: users.userA, productId, sourceType: "PURCHASE" } })).toBe(1);
  });

  it("18. el mismo PaymentEvent no se procesa dos veces", async () => {
    const created = await checkout();
    const payment = providerPayment(created.purchase);
    const eventId = `same-event-${suffix}`;
    expect((await notify(created.purchase, payment, eventId)).outcome).toBe("processed");
    expect((await notify(created.purchase, payment, eventId)).outcome).toBe("duplicate");
    expect(gateway.getPayment).toHaveBeenCalledTimes(1);
  });

  it("19. un monto incorrecto no concede acceso", async () => {
    const created = await checkout();
    expect((await notify(created.purchase, providerPayment(created.purchase, { transactionAmount: "1.00" }))).outcome).toBe("ignored");
    expect(await prisma.entitlement.count({ where: { userId: users.userA, sourceType: "PURCHASE" } })).toBe(0);
  });

  it("20. una moneda incorrecta no concede acceso", async () => {
    const created = await checkout();
    expect((await notify(created.purchase, providerPayment(created.purchase, { currency: "USD" }))).outcome).toBe("ignored");
    expect(await prisma.entitlement.count({ where: { userId: users.userA, sourceType: "PURCHASE" } })).toBe(0);
  });

  it("21. una external_reference desconocida no concede acceso", async () => {
    const created = await checkout();
    expect((await notify(created.purchase, providerPayment(created.purchase, { externalReference: "cis_purchase_unknown" }))).outcome).toBe("ignored");
    expect(await prisma.entitlement.count({ where: { userId: users.userA, sourceType: "PURCHASE" } })).toBe(0);
  });

  it("22. un refund revoca el entitlement de esa compra", async () => {
    const created = await checkout();
    const approved = providerPayment(created.purchase);
    await notify(created.purchase, approved, `approve-refund-${suffix}`);
    await notify(created.purchase, { ...approved, status: "refunded", amountRefunded: "12500.00" }, `refund-${suffix}`);
    const entitlement = await prisma.entitlement.findUniqueOrThrow({ where: { userId_productId_sourceType: { userId: users.userA, productId, sourceType: "PURCHASE" } } });
    expect(entitlement.status).toBe("REVOKED");
    expect(entitlement.revokedAt).toEqual(now);
  });

  it("23. la back_url de éxito no crea entitlement", async () => {
    const before = await prisma.entitlement.count({ where: { userId: users.userA, sourceType: "PURCHASE" } });
    const { default: SuccessPage } = await import("../src/app/academia/compra/exito/page");
    expect(SuccessPage()).toBeTruthy();
    expect(await prisma.entitlement.count({ where: { userId: users.userA, sourceType: "PURCHASE" } })).toBe(before);
  });

  it("24. un usuario no puede consultar la compra de otro", async () => {
    const { findPurchaseForUser } = await import("../src/services/purchases");
    const created = await checkout(users.userB);
    expect(await findPurchaseForUser(created.purchase.id, users.userA, prisma)).toBeNull();
    expect((await findPurchaseForUser(created.purchase.id, users.userB, prisma))?.id).toBe(created.purchase.id);
  });
});
