import { PrismaClient } from '@prisma/client';
import {
  SpeechConfig,
  SpeechSynthesisOutputFormat,
  SpeechSynthesisResult,
  SpeechSynthesizer,
} from 'microsoft-cognitiveservices-speech-sdk';
import { z } from 'zod';
import { db } from '../db';
import { JobPayloadSchema, JobType, claimJob, markJobCompleted, markJobFailed } from '../db/jobs';

const env = z
  .object({
    NEWSCAST_AZURE_SPEECH_KEY: z.string().min(1),
    NEWSCAST_AZURE_SPEECH_REGION: z.string().min(1),
    NEWSCAST_GENERATE_BROADCAST_AUDIO_VOICE_NAME: z.string().min(1),
    NEWSCAST_GENERATE_BROADCAST_AUDIO_OUTPUT_DIR: z.string().min(1),
  })
  .parse(process.env);

const speechConfig = SpeechConfig.fromSubscription(env.NEWSCAST_AZURE_SPEECH_KEY, env.NEWSCAST_AZURE_SPEECH_REGION);
speechConfig.speechSynthesisVoiceName = env.NEWSCAST_GENERATE_BROADCAST_AUDIO_VOICE_NAME;
speechConfig.speechSynthesisOutputFormat = SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;

while (true) {
  const job = await claimJob(db, JobType.generateBroadcastAudio);
  if (!job) {
    break;
  }

  console.log(`Claimed generateBroadcastAudio job ${job.id}`);

  try {
    const payload = JobPayloadSchema.generateBroadcastAudio.parse(JSON.parse(job.payload));
    await generateBroadcastAudio(
      db,
      speechConfig,
      payload.broadcastID,
      env.NEWSCAST_GENERATE_BROADCAST_AUDIO_OUTPUT_DIR,
    );
    await markJobCompleted(db, job.id);

    console.log(`Completed generateBroadcastAudio job ${job.id}`);
  } catch (ex) {
    console.error(ex);

    await markJobFailed(db, job.id);

    console.log(`Failed generateBroadcastAudio job ${job.id}`);
  }
}

console.log('No more generateBroadcastAudio jobs');

async function generateBroadcastAudio(
  db: PrismaClient,
  speechConfig: SpeechConfig,
  broadcastID: number,
  outputDir: string,
) {
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

    console.log('Generating audio segment...');

    const { introduction, body, conclusion } = topic.topicSegment;
    const text = [introduction, body, conclusion].join('\n\n');
    const result = await speakTextToFile(speechConfig, text);
    results.push(result);

    const path = `${outputDir}broadcast-${broadcast.id.toString().padStart(4, '0')}-topic-${topic.id
      .toString()
      .padStart(4, '0')}.mp3`;
    await Bun.write(path, result.audioData);

    console.log(path, `${(result.audioDuration / (1_000_000_000 / 100)).toFixed(2)}s`);
    console.log('Audio segment generated');
  }

  console.log(
    `Created ${results.length} audio segments (${(
      results.reduce((prev, curr) => prev + curr.audioDuration, 0) /
      (1_000_000_000 / 100)
    ).toFixed(2)}s) for broadcast ${broadcast.id}`,
  );
}

function speakTextToFile(speechConfig: SpeechConfig, text: string) {
  const synthesizer = new SpeechSynthesizer(speechConfig);

  return new Promise<SpeechSynthesisResult>((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (r) => {
        synthesizer.close();
        resolve(r);
      },
      (e) => {
        synthesizer.close();
        reject(e);
      },
    );
  });
}
