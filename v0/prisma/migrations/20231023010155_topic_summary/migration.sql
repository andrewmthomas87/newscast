-- CreateTable
CREATE TABLE "TopicSegment" (
    "topicID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "model" TEXT NOT NULL,
    "introduction" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    CONSTRAINT "TopicSegment_topicID_fkey" FOREIGN KEY ("topicID") REFERENCES "Topic" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
