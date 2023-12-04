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
  const job = await claimJob(db, JobType.generateBroadcastText);
  if (!job) {
    break;
  }

  console.log(`Claimed generateBroadcastText job ${job.id}`);

  try {
    const payload = JobPayloadSchema.generateBroadcastText.parse(JSON.parse(job.payload));
    await generateBroadcastText(ai, db, payload.broadcastID);
    await markJobCompleted(db, job.id);

    console.log(`Completed generateBroadcastText job ${job.id}`);
  } catch (ex) {
    console.error(ex);

    await markJobFailed(db, job.id);

    console.log(`Failed generateBroadcastText job ${job.id}`);
  }
}

console.log('No more generateBroadcastText jobs');

async function generateBroadcastText(ai: AI, db: PrismaClient, broadcastID: number) {
  const broadcast = await db.broadcast.findUniqueOrThrow({
    where: { id: broadcastID },
    include: { topics: { include: { topicSummary: true } } },
  });

  const topicSegmentCreateInputs: Prisma.TopicSegmentCreateInput[] = [];
  for (const topic of broadcast.topics) {
    console.log(`Topic: ${topic.name}, ${topic.query}`);

    if (!topic.topicSummary) {
      console.log('No topic summary. Skipping...');

      continue;
    }

    console.log('Generating segment...');

    const segment = await ai.generateSegment(topic.topicSummary.summary);

    console.log(segment);
    console.log('Segment generated');

    topicSegmentCreateInputs.push({
      topic: { connect: { id: topic.id } },
      model: ai.model,
      introduction: segment.introduction,
      body: segment.body,
      conclusion: segment.conclusion,

      //##
      
      images:topic.topicSummary.images,

      //##

    
    });
  }

  console.log('Creating DB records...');

  const topicSegments = await db.$transaction(topicSegmentCreateInputs.map((data) => db.topicSegment.create({ data })));

  console.log('DB records created');

  const payload = { broadcastID: broadcast.id } satisfies JobPayload['generateBroadcastAudio'];
  const job = await db.job.create({ data: { type: JobType.generateBroadcastAudio, payload: JSON.stringify(payload) } });

  console.log(`Created ${topicSegments.length} topic segments for broadcast ${broadcast.id}`);
  console.log(`Queued generateBroadcastAudio job ${job.id}`);
}
