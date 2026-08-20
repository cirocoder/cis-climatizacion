-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('KIT', 'COURSE');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ProductAccessType" AS ENUM ('ONE_TIME', 'CONTINUOUS');
CREATE TYPE "EntitlementStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');
CREATE TYPE "EntitlementSourceType" AS ENUM ('ADMIN', 'PURCHASE', 'SUBSCRIPTION');

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "accessType" "ProductAccessType" NOT NULL,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "entitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "sourceType" "EntitlementSourceType" NOT NULL,
    "sourceId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "entitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_slug_key" ON "product"("slug");
CREATE INDEX "product_status_idx" ON "product"("status");
CREATE INDEX "entitlement_userId_idx" ON "entitlement"("userId");
CREATE INDEX "entitlement_productId_idx" ON "entitlement"("productId");
CREATE INDEX "entitlement_userId_productId_status_idx" ON "entitlement"("userId", "productId", "status");
CREATE UNIQUE INDEX "entitlement_userId_productId_sourceType_key" ON "entitlement"("userId", "productId", "sourceType");

ALTER TABLE "entitlement" ADD CONSTRAINT "entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "entitlement" ADD CONSTRAINT "entitlement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
