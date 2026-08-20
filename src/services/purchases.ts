import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { findActiveEntitlement } from "@/lib/catalog/access";
import { getPrisma } from "@/lib/db/prisma";
import { assertPublicApplicationUrl, type MercadoPagoGateway, type MercadoPagoPayment } from "@/lib/payments/mercadopago";

type Database = ReturnType<typeof getPrisma>;
const CHECKOUT_WINDOW_MS = 15 * 60 * 1000;
const CHECKOUT_ATTEMPT_LIMIT = 3;

export class PurchaseError extends Error {
  constructor(public code: "NOT_FOUND" | "UNAVAILABLE" | "NO_PRICE" | "ALREADY_OWNED" | "IN_PROGRESS" | "RATE_LIMITED" | "PROVIDER_ERROR" | "INVALID_PAYMENT", message: string) {
    super(message);
  }
}

export async function createCheckout(input: {
  userId: string;
  slug: string;
  appUrl: string;
  gateway: MercadoPagoGateway;
  now?: Date;
  db?: Database;
}) {
  const db = input.db ?? getPrisma();
  const now = input.now ?? new Date();
  const appOrigin = assertPublicApplicationUrl(input.appUrl);
  const product = await db.product.findUnique({ where: { slug: input.slug } });
  if (!product) throw new PurchaseError("NOT_FOUND", "Producto no encontrado");
  if (product.status !== "PUBLISHED" || product.accessType !== "ONE_TIME") {
    throw new PurchaseError("UNAVAILABLE", "El producto no está disponible para compra");
  }
  if (product.price === null || !product.price.greaterThan(0)) throw new PurchaseError("NO_PRICE", "El producto todavía no tiene un precio configurado");
  if (product.currency !== "ARS") throw new PurchaseError("UNAVAILABLE", "La moneda del producto no es compatible");
  if (await findActiveEntitlement(input.userId, product.id, now, db)) {
    throw new PurchaseError("ALREADY_OWNED", "El usuario ya tiene acceso al producto");
  }

  const checkoutKey = `${input.userId}:${product.id}`;
  const openPurchase = await db.purchase.findUnique({ where: { checkoutKey }, include: { items: true } });
  if (openPurchase?.providerCheckoutUrl) {
    return { purchase: openPurchase, checkoutUrl: openPurchase.providerCheckoutUrl, reused: true };
  }
  if (openPurchase) throw new PurchaseError("IN_PROGRESS", "Ya existe una compra en preparación");

  const recentAttempts = await db.purchase.count({
    where: { userId: input.userId, createdAt: { gte: new Date(now.getTime() - CHECKOUT_WINDOW_MS) } },
  });
  if (recentAttempts >= CHECKOUT_ATTEMPT_LIMIT) {
    throw new PurchaseError("RATE_LIMITED", "Demasiados intentos de compra. Intentá nuevamente más tarde");
  }

  const purchaseId = randomUUID();
  const externalReference = `cis_purchase_${purchaseId}`;
  const purchase = await db.purchase.create({
    data: {
      id: purchaseId,
      userId: input.userId,
      currency: product.currency,
      total: product.price,
      externalReference,
      checkoutKey,
      items: {
        create: {
          productId: product.id,
          productTitleSnapshot: product.title,
          unitPrice: product.price,
          quantity: 1,
          subtotal: product.price,
        },
      },
    },
    include: { items: true },
  });

  try {
    const preference = await input.gateway.createPreference({
      purchaseId: purchase.id,
      title: product.title,
      unitPrice: product.price.toFixed(2),
      currency: product.currency,
      externalReference,
      notificationUrl: `${appOrigin}/api/webhooks/mercadopago`,
      successUrl: `${appOrigin}/academia/compra/exito`,
      pendingUrl: `${appOrigin}/academia/compra/pendiente`,
      failureUrl: `${appOrigin}/academia/compra/error`,
    });
    const updated = await db.purchase.update({
      where: { id: purchase.id },
      data: { providerPreferenceId: preference.id, providerCheckoutUrl: preference.checkoutUrl },
      include: { items: true },
    });
    return { purchase: updated, checkoutUrl: preference.checkoutUrl, reused: false };
  } catch {
    await db.purchase.update({
      where: { id: purchase.id },
      data: { status: "CANCELLED", cancelledAt: now, checkoutKey: null },
    });
    throw new PurchaseError("PROVIDER_ERROR", "No se pudo iniciar el checkout");
  }
}

export type EventInput = {
  providerEventId: string;
  eventType: string;
  providerResourceId: string;
  payload?: Prisma.InputJsonValue;
};

function mappedPurchaseStatus(status: string) {
  if (status === "refunded" || status === "charged_back") return "REFUNDED" as const;
  if (status === "approved") return "APPROVED" as const;
  if (["pending", "in_process", "in_mediation", "authorized"].includes(status)) return "PENDING" as const;
  if (status === "rejected") return "REJECTED" as const;
  if (status === "cancelled") return "CANCELLED" as const;
  return null;
}

async function reservePaymentEvent(db: Database, input: EventInput) {
  const existing = await db.paymentEvent.findUnique({
    where: { provider_providerEventId: { provider: "MERCADOPAGO", providerEventId: input.providerEventId } },
  });
  if (existing && ["PROCESSED", "IGNORED", "PROCESSING"].includes(existing.processingStatus)) return null;
  if (!existing) {
    try {
      return await db.paymentEvent.create({
        data: { provider: "MERCADOPAGO", ...input, processingStatus: "PROCESSING" },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
      throw error;
    }
  }
  const claimed = await db.paymentEvent.updateMany({
    where: { id: existing.id, processingStatus: { in: ["RECEIVED", "FAILED"] } },
    data: { processingStatus: "PROCESSING", error: null },
  });
  return claimed.count === 1 ? db.paymentEvent.findUniqueOrThrow({ where: { id: existing.id } }) : null;
}

export async function processPaymentNotification(input: {
  event: EventInput;
  gateway: MercadoPagoGateway;
  expectedCollectorId: string;
  now?: Date;
  db?: Database;
}) {
  const db = input.db ?? getPrisma();
  const event = await reservePaymentEvent(db, input.event);
  if (!event) return { outcome: "duplicate" as const };

  try {
    const payment = await input.gateway.getPayment(input.event.providerResourceId);
    if (payment.id !== input.event.providerResourceId || payment.collectorId !== input.expectedCollectorId) {
      throw new PurchaseError("INVALID_PAYMENT", "El pago no pertenece a la integración esperada");
    }
    return await applyVerifiedPayment(db, payment, event.id, input.now ?? new Date());
  } catch (error) {
    const isValidation = error instanceof PurchaseError && error.code === "INVALID_PAYMENT";
    await db.paymentEvent.update({
      where: { id: event.id },
      data: {
        processingStatus: isValidation ? "IGNORED" : "FAILED",
        processedAt: isValidation ? input.now ?? new Date() : null,
        error: error instanceof Error ? error.message.slice(0, 300) : "Error no identificado",
      },
    });
    if (isValidation) return { outcome: "ignored" as const };
    throw error;
  }
}

async function applyVerifiedPayment(db: Database, payment: MercadoPagoPayment, eventId: string, now: Date) {
  const mappedStatus = mappedPurchaseStatus(payment.status);
  if (!mappedStatus || !payment.externalReference) {
    await db.paymentEvent.update({ where: { id: eventId }, data: { processingStatus: "IGNORED", processedAt: now } });
    return { outcome: "ignored" as const };
  }

  return db.$transaction(async tx => {
    const purchase = await tx.purchase.findUnique({
      where: { externalReference: payment.externalReference! },
      include: { items: true },
    });
    if (!purchase) {
      await tx.paymentEvent.update({ where: { id: eventId }, data: { processingStatus: "IGNORED", processedAt: now, error: "Referencia interna desconocida" } });
      return { outcome: "ignored" as const };
    }
    if (!new Prisma.Decimal(payment.transactionAmount).equals(purchase.total) || payment.currency !== purchase.currency) {
      await tx.paymentEvent.update({ where: { id: eventId }, data: { purchaseId: purchase.id, processingStatus: "IGNORED", processedAt: now, error: "Monto o moneda no coinciden" } });
      return { outcome: "ignored" as const };
    }
    if (purchase.providerPaymentId && purchase.providerPaymentId !== payment.id) {
      await tx.paymentEvent.update({ where: { id: eventId }, data: { purchaseId: purchase.id, processingStatus: "IGNORED", processedAt: now, error: "La compra ya está asociada a otro pago" } });
      return { outcome: "ignored" as const };
    }

    let effectiveStatus = mappedStatus;
    if (purchase.status === "REFUNDED") effectiveStatus = "REFUNDED";
    else if (purchase.status === "APPROVED" && mappedStatus !== "REFUNDED") effectiveStatus = "APPROVED";

    const terminal = ["APPROVED", "REJECTED", "CANCELLED", "REFUNDED"].includes(effectiveStatus);
    await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        status: effectiveStatus,
        providerPaymentId: payment.id,
        checkoutKey: terminal ? null : purchase.checkoutKey,
        approvedAt: effectiveStatus === "APPROVED" ? payment.dateApproved ?? purchase.approvedAt ?? now : purchase.approvedAt,
        cancelledAt: effectiveStatus === "CANCELLED" ? purchase.cancelledAt ?? now : purchase.cancelledAt,
        refundedAt: effectiveStatus === "REFUNDED" ? purchase.refundedAt ?? now : purchase.refundedAt,
      },
    });

    if (effectiveStatus === "APPROVED") {
      for (const item of purchase.items) {
        await tx.entitlement.upsert({
          where: { userId_productId_sourceType: { userId: purchase.userId, productId: item.productId, sourceType: "PURCHASE" } },
          create: { userId: purchase.userId, productId: item.productId, sourceType: "PURCHASE", sourceId: purchase.id, status: "ACTIVE", startsAt: now, expiresAt: null },
          update: { sourceId: purchase.id, status: "ACTIVE", startsAt: now, expiresAt: null, revokedAt: null, reason: null },
        });
      }
    } else if (effectiveStatus === "REFUNDED") {
      for (const item of purchase.items) {
        await tx.entitlement.updateMany({
          where: { userId: purchase.userId, productId: item.productId, sourceType: "PURCHASE", sourceId: purchase.id },
          data: { status: "REVOKED", revokedAt: now, reason: "Acceso revocado por reembolso de la compra" },
        });
      }
    }

    await tx.paymentEvent.update({
      where: { id: eventId },
      data: { purchaseId: purchase.id, processingStatus: "PROCESSED", processedAt: now, error: null },
    });
    return { outcome: "processed" as const, status: effectiveStatus, purchaseId: purchase.id };
  });
}

export async function findPurchaseForUser(purchaseId: string, userId: string, db: Database = getPrisma()) {
  return db.purchase.findFirst({ where: { id: purchaseId, userId }, include: { items: true } });
}

export async function reconcilePendingPurchases(input: {
  gateway: MercadoPagoGateway;
  expectedCollectorId: string;
  olderThan?: Date;
  db?: Database;
}) {
  const db = input.db ?? getPrisma();
  const purchases = await db.purchase.findMany({
    where: { status: "PENDING", providerPaymentId: { not: null }, updatedAt: { lte: input.olderThan ?? new Date(Date.now() - 10 * 60 * 1000) } },
  });
  const results = [];
  for (const purchase of purchases) {
    results.push(await processPaymentNotification({
      db,
      gateway: input.gateway,
      expectedCollectorId: input.expectedCollectorId,
      event: {
        providerEventId: `reconcile:${purchase.providerPaymentId}:${purchase.updatedAt.getTime()}`,
        eventType: "reconciliation",
        providerResourceId: purchase.providerPaymentId!,
        payload: { source: "reconciliation" },
      },
    }));
  }
  return results;
}
