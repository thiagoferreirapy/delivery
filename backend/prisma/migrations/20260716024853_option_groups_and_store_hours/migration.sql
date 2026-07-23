-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "selectionsJson" TEXT;

-- CreateTable
CREATE TABLE "OptionGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SINGLE',
    "kind" TEXT NOT NULL DEFAULT 'ADD',
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER,
    "pricingRule" TEXT NOT NULL DEFAULT 'SUM',
    "allowQuantity" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OptionGroup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OptionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceDelta" DECIMAL NOT NULL DEFAULT 0,
    "linkedProductId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OptionItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OptionGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OptionItem_linkedProductId_fkey" FOREIGN KEY ("linkedProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Cabana Lanches',
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "pausedMsg" TEXT,
    "lastOrderMinutes" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OpeningHour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL DEFAULT 'default',
    "weekday" INTEGER NOT NULL,
    "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "OpeningHour_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "StoreSettings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OptionGroup_productId_idx" ON "OptionGroup"("productId");

-- CreateIndex
CREATE INDEX "OptionItem_groupId_idx" ON "OptionItem"("groupId");

-- CreateIndex
CREATE INDEX "OptionItem_linkedProductId_idx" ON "OptionItem"("linkedProductId");

-- CreateIndex
CREATE INDEX "OpeningHour_storeId_idx" ON "OpeningHour"("storeId");

-- CreateIndex
CREATE INDEX "OpeningHour_weekday_idx" ON "OpeningHour"("weekday");
