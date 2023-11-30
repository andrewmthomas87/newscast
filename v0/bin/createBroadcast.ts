import { db } from '../db';
import { JobPayload, JobType } from '../db/jobs';

const { broadcast, job } = await db.$transaction(async () => {
  const broadcast = await db.broadcast.create({});

  const payload = { broadcastID: broadcast.id } satisfies JobPayload['gatherNews'];
  const job = await db.job.create({
    data: { type: JobType.gatherNews, payload: JSON.stringify(payload) },
  });

  return { broadcast, job };
});

console.log(`Created broadcast ${broadcast.id}`);
console.log(`Queued gatherNews job ${job.id}`);
