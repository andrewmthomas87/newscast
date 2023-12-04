-- CreateTable
CREATE TABLE "TopicTransition" (
    "prevTopicSegmentTopicID" INTEGER NOT NULL,
    "nextTopicSegmentTopicID" INTEGER NOT NULL,
    "transition" TEXT NOT NULL,

    PRIMARY KEY ("prevTopicSegmentTopicID", "nextTopicSegmentTopicID"),
    CONSTRAINT "TopicTransition_prevTopicSegmentTopicID_fkey" FOREIGN KEY ("prevTopicSegmentTopicID") REFERENCES "TopicSegment" ("topicID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TopicTransition_nextTopicSegmentTopicID_fkey" FOREIGN KEY ("nextTopicSegmentTopicID") REFERENCES "TopicSegment" ("topicID") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicTransition_prevTopicSegmentTopicID_key" ON "TopicTransition"("prevTopicSegmentTopicID");

-- CreateIndex
CREATE UNIQUE INDEX "TopicTransition_nextTopicSegmentTopicID_key" ON "TopicTransition"("nextTopicSegmentTopicID");
