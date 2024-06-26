-- CreateTable
CREATE TABLE "Article" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "topicID" INTEGER NOT NULL,
    CONSTRAINT "Article_topicID_fkey" FOREIGN KEY ("topicID") REFERENCES "Topic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
