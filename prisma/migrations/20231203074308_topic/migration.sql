-- CreateTable
CREATE TABLE "Topic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "broadcastID" INTEGER NOT NULL,
    CONSTRAINT "Topic_broadcastID_fkey" FOREIGN KEY ("broadcastID") REFERENCES "Broadcast" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
