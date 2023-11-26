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
    const job = await claimJob(db, JobType.generateTransitions);
    if (!job) {
      break;
    }


    console.log(`Claimed combine broadcast job ${job.id}`);

    try {
        const payload = JobPayloadSchema.generateTransitions.parse(JSON.parse(job.payload));
        await generateTransitions(ai, db, payload.broadcastID);
        await markJobCompleted(db, job.id);
    
        console.log(`Completed combine broadcast job ${job.id}`);
      } catch (ex) {
        console.error(ex);
        await markJobFailed(db, job.id);
        console.log(`Failed combine broadcast job ${job.id}`);
      }

}

console.log('No more combine broadcast jobs');


// Generate Combined Broadcast

export async function generateTransitions(ai: AI, db: PrismaClient, broadcastID: number) {

  const broadcast = await db.broadcast.findUniqueOrThrow({
    where: { id: broadcastID },
    include: { topics: { include: { topicSegment: true } } },
  });

  const results = [];
  for (const topic of broadcast.topics) {
    console.log(`Topic: ${topic.name}, ${topic.query}`);

    if (!topic.topicSegment) {
      console.log('No topic segment. Skipping...');

      continue;
    }

   // const { introduction, body, conclusion } = topic.topicSegment;
 //   const text = [introduction, body, conclusion].join('\n\n');
    results.push(topic)

    // Need to push result into article column of new database

    
  }

  const topicTransitionCreateInputs: Prisma.TopicTransitionCreateInput[] = [];

  for(var segment = 0; segment < results.length - 1; segment++){
    const first = results[segment]
    const second = results[segment+1]


    const firstJoined = [first.topicSegment?.introduction, first.topicSegment?.body, first.topicSegment?.conclusion].join('\n\n');
    const secondJoined = [second.topicSegment?.introduction, second.topicSegment?.body, second.topicSegment?.conclusion].join('\n\n');

    
    const transition = await ai.generateTransition(firstJoined, secondJoined)
    console.log("transition: ", transition)

    // Need to push the transition into the database

    topicTransitionCreateInputs.push({
      prevTopic: { connect: {topicID: first.topicSegment?.topicID } },
      nextTopic: { connect: { topicID: second.topicSegment?.topicID } },
      transition: transition
    });
  }


  console.log('Creating DB records...');

  const topicTransitions = await db.$transaction(topicTransitionCreateInputs.map((data) => db.topicTransition.create({ data })));
 

  console.log('DB records created');

  const payload = { broadcastID: broadcast.id } satisfies JobPayload['generateCombinedBroadcast'];
  const job = await db.job.create({ data: { type: JobType.generateCombinedBroadcast, payload: JSON.stringify(payload) } });

  console.log(`Created ${topicTransitions.length} topic transitions for broadcast ${broadcast.id}`);
  console.log(`Queued generateCombinedBroadcast job ${job.id}`);
  return topicTransitions
  
  



    /*
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
    */
  }