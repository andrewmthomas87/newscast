import { Prisma } from "@prisma/client";
import { AI } from "../ai";
import { db } from "../db";
import { Throttler } from "../utils/throttler";
import {
  JobPayloadSchema,
  JobType,
  claimJob,
  markJobCompleted,
  markJobFailed,
} from "../db/jobs";
import { z } from "zod";

const env = z
  .object({
    NEWSCAST_OPENAI_API_KEY: z.string().min(1),
    NEWSCAST_OPENAI_API_MODEL: z.string().min(1),
    NEWSCAST_OPENAI_API_THROTTLE_RPS: z.coerce.number().gt(0),
  })
  .parse(process.env);

const ai = new AI(
  env.NEWSCAST_OPENAI_API_KEY,
  env.NEWSCAST_OPENAI_API_MODEL,
  new Throttler(env.NEWSCAST_OPENAI_API_THROTTLE_RPS),
);

while (true) {
  const job = await claimJob(db, JobType.summarize);
  if (!job) {
    break;
  }

  console.log(`Claimed summarize job ${job.id}`);

  try {
    const payload = JobPayloadSchema.summarize.parse(JSON.parse(job.payload));
    await summarize(ai, payload.broadcastID);
    await markJobCompleted(db, job.id);

    console.log(`Completed summarize job ${job.id}`);
  } catch (ex) {
    console.error(ex);

    await markJobFailed(db, job.id);

    console.log(`Failed summarize job ${job.id}`);
  }
}

console.log("No more summarize jobs");

async function summarize(ai: AI, broadcastID: number) {
  const broadcast = await db.broadcast.findUniqueOrThrow({
    where: { id: broadcastID },
    include: { topics: { include: { articles: true } } },
  });

  const datas: Prisma.ArticleSummaryCreateInput[] = [];
  for (const topic of broadcast.topics) {
    console.log(`Topic: ${topic.name}, ${topic.query}`);

    for (const article of topic.articles) {
      console.log(`Article: ${article.name}, ${article.url}`);
      console.log("Generating summary...");

      const summary = await ai.summarizeArticle(
        article.name,
        article.textContent,
      );
      if (!summary) {
        throw new Error("unexpected empty summary");
      }

      console.log("Summary generated");

      datas.push({
        article: { connect: { id: article.id } },
        model: ai.model,
        summary,
      });
    }
  }

  console.log("Writing DB records...");

  const summaries = await db.$transaction(
    datas.map((data) => db.articleSummary.create({ data })),
  );

  console.log("DB records written");

  console.log(`Created ${summaries.length} article summaries`);
}
