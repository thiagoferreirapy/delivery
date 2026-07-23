-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'STORE',
    "senderType" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderMessage" ("body", "createdAt", "id", "orderId", "readAt", "senderId", "senderName", "senderType") SELECT "body", "createdAt", "id", "orderId", "readAt", "senderId", "senderName", "senderType" FROM "OrderMessage";
DROP TABLE "OrderMessage";
ALTER TABLE "new_OrderMessage" RENAME TO "OrderMessage";
CREATE INDEX "OrderMessage_orderId_idx" ON "OrderMessage"("orderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
