-- CreateTable
CREATE TABLE "TopicSummary" (
    "topicID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "model" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    CONSTRAINT "TopicSummary_topicID_fkey" FOREIGN KEY ("topicID") REFERENCES "Topic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
