-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "extrasJson" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "removedJson" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "maxExtras" INTEGER;
ALTER TABLE "Product" ADD COLUMN "maxRemovable" INTEGER;

-- CreateTable
CREATE TABLE "ProductExtra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductExtra_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductRemovable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductRemovable_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProductExtra_productId_idx" ON "ProductExtra"("productId");

-- CreateIndex
CREATE INDEX "ProductRemovable_productId_idx" ON "ProductRemovable"("productId");
