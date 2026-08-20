-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('CREATED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MERCADOPAGO');

-- CreateEnum
CREATE TYPE "PaymentEventProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateTable
CREATE TABLE "purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'CREATED',
    "currency" TEXT NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "externalReference" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'MERCADOPAGO',
    "providerPreferenceId" TEXT,
    "providerPaymentId" TEXT,
    "providerCheckoutUrl" TEXT,
    "checkoutKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productTitleSnapshot" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paymentEvent" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerResourceId" TEXT NOT NULL,
    "payload" JSONB,
    "processingStatus" "PaymentEventProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "paymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_externalReference_key" ON "purchase"("externalReference");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_providerPreferenceId_key" ON "purchase"("providerPreferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_providerPaymentId_key" ON "purchase"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_checkoutKey_key" ON "purchase"("checkoutKey");

-- CreateIndex
CREATE INDEX "purchase_userId_idx" ON "purchase"("userId");

-- CreateIndex
CREATE INDEX "purchase_userId_status_createdAt_idx" ON "purchase"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "purchase_status_updatedAt_idx" ON "purchase"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "purchaseItem_purchaseId_idx" ON "purchaseItem"("purchaseId");

-- CreateIndex
CREATE INDEX "purchaseItem_productId_idx" ON "purchaseItem"("productId");

-- CreateIndex
CREATE INDEX "paymentEvent_provider_providerResourceId_idx" ON "paymentEvent"("provider", "providerResourceId");

-- CreateIndex
CREATE INDEX "paymentEvent_processingStatus_receivedAt_idx" ON "paymentEvent"("processingStatus", "receivedAt");

-- CreateIndex
CREATE INDEX "paymentEvent_purchaseId_idx" ON "paymentEvent"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "paymentEvent_provider_providerEventId_key" ON "paymentEvent"("provider", "providerEventId");

-- AddForeignKey
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseItem" ADD CONSTRAINT "purchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchaseItem" ADD CONSTRAINT "purchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paymentEvent" ADD CONSTRAINT "paymentEvent_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
