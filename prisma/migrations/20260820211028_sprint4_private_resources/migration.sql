-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'CHECKLIST', 'TEMPLATE', 'REPORT', 'MEASUREMENT_SHEET', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'COMING_SOON', 'ARCHIVED');

-- CreateTable
CREATE TABLE "resource" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResourceType" NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'DRAFT',
    "storageKey" TEXT,
    "mimeType" TEXT,
    "fileSize" BIGINT,
    "downloadName" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_storageKey_key" ON "resource"("storageKey");

-- CreateIndex
CREATE INDEX "resource_productId_idx" ON "resource"("productId");

-- CreateIndex
CREATE INDEX "resource_status_idx" ON "resource"("status");

-- CreateIndex
CREATE INDEX "resource_position_idx" ON "resource"("position");

-- CreateIndex
CREATE INDEX "resource_productId_status_idx" ON "resource"("productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "resource_productId_title_key" ON "resource"("productId", "title");

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AVAILABLE always represents a verified private object, never an empty catalog promise.
ALTER TABLE "resource" ADD CONSTRAINT "resource_available_object_check" CHECK (
    "status" <> 'AVAILABLE'
    OR (
        "storageKey" IS NOT NULL
        AND "mimeType" IS NOT NULL
        AND "downloadName" IS NOT NULL
        AND "fileSize" IS NOT NULL
        AND "fileSize" > 0
    )
);
