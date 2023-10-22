import { Job, Prisma } from "@prisma/client";
import { AI } from "../ai";
import { db } from "../db";
import { Throttler } from "../utils/throttler";

const OPENAI_API_KEY = process.env.NEWSCAST_OPENAI_API_KEY;
const OPENAI_API_MODEL = process.env.NEWSCAST_OPENAI_API_MODEL;
const OPENAI_API_THROTTLE_RPS = parseFloat(
  process.env.NEWSCAST_OPENAI_API_THROTTLE_RPS || "",
);

if (!OPENAI_API_KEY) {
  throw new Error("expected env NEWSCAST_OPENAI_API_KEY (string)");
} else if (!OPENAI_API_MODEL) {
  throw new Error("expected env NEWSCAST_OPENAI_API_MODEL (string)");
} else if (isNaN(OPENAI_API_THROTTLE_RPS)) {
  throw new Error("expected env NEWSCAST_OPENAI_API_THROTTLE_RPS (number)");
}

const ai = new AI(
  OPENAI_API_KEY,
  OPENAI_API_MODEL,
  new Throttler(OPENAI_API_THROTTLE_RPS),
);

while (true) {
  const job = await db.$transaction(async () => {
    const job = await db.job.findFirst({
      where: { type: "summarize", status: "pending" },
      orderBy: { createdAt: "desc" },
    });
    if (!job) {
      return undefined;
    }

    return await db.job.update({
      where: { id: job.id },
      data: { status: "processing", startedAt: new Date() },
    });
  });

  if (!job) {
    break;
  }

  console.log(`Starting job ${job.id}`);

  try {
    await runSummarizeJob(job);

    await db.job.update({
      where: { id: job.id },
      data: { status: "completed", completedAt: new Date() },
    });

    console.log(`Completed job ${job.id}`);
  } catch (ex) {
    await db.job.update({ where: { id: job.id }, data: { status: "failed" } });

    console.error(ex);
    console.log(`Failed job ${job.id}`);
  }
}

console.log("No more summarize jobs");

async function runSummarizeJob(job: Job) {
  const data: unknown = JSON.parse(job.payload);
  if (
    !(
      data &&
      typeof data === "object" &&
      "broadcastID" in data &&
      typeof data.broadcastID === "number"
    )
  ) {
    throw new Error("invalid summarize payload");
  }

  const broadcast = await db.broadcast.findUniqueOrThrow({
    where: { id: data.broadcastID },
    include: { topics: { include: { articles: true } } },
  });

  const datas: Prisma.ArticleSummaryCreateInput[] = [];
  for (const topic of broadcast.topics) {
    for (const article of topic.articles) {
      const summary = await ai.summarizeArticle(
        article.name,
        article.textContent,
      );
      if (!summary) {
        throw new Error("unexpected empty summary");
      }

      datas.push({
        article: { connect: { id: article.id } },
        model: ai.model,
        summary,
      });
    }
  }

  const summaries = await db.$transaction(
    datas.map((data) => db.articleSummary.create({ data })),
  );

  console.log(`Created ${summaries.length} article summaries`);
}
