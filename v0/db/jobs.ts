import { PrismaClient } from '@prisma/client';
import { Schema, z } from 'zod';

export const JobType = {
  gatherNews: 'gatherNews',
  summarize: 'summarize',
  generateBroadcastText: 'generateBroadcastText',
  generateBroadcastAudio: 'generateBroadcastAudio',
} as const;

export type JobType = (typeof JobType)[keyof typeof JobType];
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export const JobPayloadSchema = {
  gatherNews: z.object({ broadcastID: z.number() }),
  summarize: z.object({ broadcastID: z.number() }),
  generateBroadcastText: z.object({ broadcastID: z.number() }),
  generateBroadcastAudio: z.object({ broadcastID: z.number() }),
} satisfies Record<JobType, Schema>;

export type JobPayload = {
  [k in keyof typeof JobPayloadSchema]: z.infer<(typeof JobPayloadSchema)[k]>;
};

export async function claimJob(db: PrismaClient, type: JobType) {
  return await db.$transaction(async () => {
    const job = await db.job.findFirst({
      where: { type, status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
    if (!job) {
      return undefined;
    }

    return await db.job.update({
      where: { id: job.id },
      data: { status: 'processing', startedAt: new Date() },
    });
  });
}

export async function markJobCompleted(db: PrismaClient, id: number) {
  await db.job.update({
    where: { id },
    data: { status: 'completed', completedAt: new Date() },
  });
}

export async function markJobFailed(db: PrismaClient, id: number) {
  await db.job.update({ where: { id }, data: { status: 'failed' } });
}
