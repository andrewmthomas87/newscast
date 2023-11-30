-- CreateTable
CREATE TABLE "ArticleSummary" (
    "articleID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "model" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    CONSTRAINT "ArticleSummary_articleID_fkey" FOREIGN KEY ("articleID") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
