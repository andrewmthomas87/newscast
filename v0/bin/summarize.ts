import { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AI } from '../ai';
import { db } from '../db';
import { JobPayload, JobPayloadSchema, JobType, claimJob, markJobCompleted, markJobFailed } from '../db/jobs';
import { Throttler } from '../utils/throttler';

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
    await summarize(ai, db, payload.broadcastID);
    await markJobCompleted(db, job.id);

    console.log(`Completed summarize job ${job.id}`);
  } catch (ex) {
    console.error(ex);

    await markJobFailed(db, job.id);

    console.log(`Failed summarize job ${job.id}`);
  }
}

console.log('No more summarize jobs');

async function summarize(ai: AI, db: PrismaClient, broadcastID: number) {
  const broadcast = await db.broadcast.findUniqueOrThrow({
    where: { id: broadcastID },
    include: { topics: { include: { articles: true } } },
  });

  const articleSummaryCreateInputs: Prisma.ArticleSummaryCreateInput[] = [];
  const topicSummaryCreateInputs: Prisma.TopicSummaryCreateInput[] = [];
  for (const topic of broadcast.topics) {
    console.log(`Topic: ${topic.name}, ${topic.query}`);

    const summaries = [];
    for (const article of topic.articles) {
      console.log(`Article: ${article.name}, ${article.url}`);
      console.log('Generating summary...');

      const summary = await ai.summarizeArticle(article.name, article.textContent);
      summaries.push(summary);

      console.log(summary);
      console.log('Summary generated');

      articleSummaryCreateInputs.push({
        article: { connect: { id: article.id } },
        model: ai.model,
        summary,
      });
    }

    console.log('Generating topic summary...');

    let topicSummary;
    if (summaries.length === 1) {
      topicSummary = summaries[0];
    } else {
      topicSummary = await ai.mergeSummaries(summaries);
    }

    console.log('Topic summary generated');

    topicSummaryCreateInputs.push({
      topic: { connect: { id: topic.id } },
      model: ai.model,
      summary: topicSummary,
    });
  }

  console.log('Writing DB records...');

  const summaries = await db.$transaction([
    ...articleSummaryCreateInputs.map((data) => db.articleSummary.create({ data })),
    ...topicSummaryCreateInputs.map((data) => db.topicSummary.create({ data })),
  ]);

  console.log('DB records written');

  const payload = { broadcastID: broadcast.id } satisfies JobPayload['generateBroadcastText'];
  const job = await db.job.create({ data: { type: JobType.generateBroadcastText, payload: JSON.stringify(payload) } });

  console.log(`Created ${summaries.length} article & topic summaries for broadcast ${broadcast.id}`);
  console.log(`Queued generateBroadcastText job ${job.id}`);
}
