/*
  Warnings:

  - Added the required column `broadcastID` to the `Topic` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Broadcast" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Topic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "json" TEXT NOT NULL,
    "broadcastID" INTEGER NOT NULL,
    CONSTRAINT "Topic_broadcastID_fkey" FOREIGN KEY ("broadcastID") REFERENCES "Broadcast" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Topic" ("createdAt", "id", "json", "name", "query") SELECT "createdAt", "id", "json", "name", "query" FROM "Topic";
DROP TABLE "Topic";
ALTER TABLE "new_Topic" RENAME TO "Topic";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
