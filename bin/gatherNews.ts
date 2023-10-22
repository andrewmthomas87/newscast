import { z } from 'zod';
import { AI } from '../ai';
import { BingNewsAPI } from '../bingNewsAPI/api';
import { db } from '../db';
import { JobPayload, JobPayloadSchema, JobType, claimJob, markJobCompleted, markJobFailed } from '../db/jobs';
import { scrapeDataFromURL } from '../scrape';
import { Throttler } from '../utils/throttler';

const env = z
  .object({
    NEWSCAST_OPENAI_API_KEY: z.string().min(1),
    NEWSCAST_OPENAI_API_MODEL: z.string().min(1),
    NEWSCAST_OPENAI_API_THROTTLE_RPS: z.coerce.number().gt(0),
    NEWSCAST_BING_NEWS_API_SUBSCRIPTION_KEY: z.string().min(1),
    NEWSCAST_BING_NEWS_API_THROTTLE_RPS: z.coerce.number().gt(0),
    NEWSCAST_GATHER_NEWS_TOPIC_COUNT: z.coerce.number().gt(0),
    NEWSCAST_GATHER_NEWS_MARKET: z.string().optional(),
    NEWSCAST_GATHER_NEWS_FRESHNESS: z.enum(['Day', 'Week', 'Month']).optional(),
    NEWSCAST_GATHER_NEWS_ARTICLE_MIN_LENGTH: z.coerce.number().gt(0),
    NEWSCAST_GATHER_NEWS_ARTICLE_MAX_LENGTH: z.coerce.number().gt(0),
    NEWSCAST_GATHER_NEWS_ARTICLE_MIN_COUNT: z.coerce.number().gt(0),
    NEWSCAST_GATHER_NEWS_ARTICLE_MAX_COUNT: z.coerce.number().gt(0),
  })
  .parse(process.env);

const ai = new AI(
  env.NEWSCAST_OPENAI_API_KEY,
  env.NEWSCAST_OPENAI_API_MODEL,
  new Throttler(env.NEWSCAST_OPENAI_API_THROTTLE_RPS),
);

const api = new BingNewsAPI(
  env.NEWSCAST_BING_NEWS_API_SUBSCRIPTION_KEY,
  new Throttler(env.NEWSCAST_BING_NEWS_API_THROTTLE_RPS),
);

while (true) {
  const job = await claimJob(db, JobType.gatherNews);
  if (!job) {
    break;
  }

  console.log(`Claimed gatherNews job ${job.id}`);

  try {
    const payload = JobPayloadSchema.gatherNews.parse(JSON.parse(job.payload));
    await gatherNews(ai, api, payload.broadcastID, {
      market: env.NEWSCAST_GATHER_NEWS_MARKET,
      freshness: env.NEWSCAST_GATHER_NEWS_FRESHNESS,
      topicCount: env.NEWSCAST_GATHER_NEWS_TOPIC_COUNT,
      articleMinLength: env.NEWSCAST_GATHER_NEWS_ARTICLE_MIN_LENGTH,
      articleMaxLength: env.NEWSCAST_GATHER_NEWS_ARTICLE_MAX_LENGTH,
      articleMinCount: env.NEWSCAST_GATHER_NEWS_ARTICLE_MIN_COUNT,
      articleMaxCount: env.NEWSCAST_GATHER_NEWS_ARTICLE_MAX_COUNT,
    });
    await markJobCompleted(db, job.id);

    console.log(`Completed gatherNews job ${job.id}`);
  } catch (ex) {
    console.error(ex);

    await markJobFailed(db, job.id);

    console.log(`Failed gatherNews job ${job.id}`);
  }
}

console.log('No more gatherNews jobs');

async function gatherNews(
  ai: AI,
  api: BingNewsAPI,
  broadcastID: number,
  cfg: {
    market?: string;
    freshness?: 'Day' | 'Week' | 'Month';
    topicCount: number;
    articleMinLength: number;
    articleMaxLength: number;
    articleMinCount: number;
    articleMaxCount: number;
  },
) {
  await db.broadcast.findUniqueOrThrow({
    where: { id: broadcastID },
  });

  const allTopics = await api.fetchTrendingTopics();

  console.log(`Fetched ${allTopics.length} topics`);

  const topics = [];
  for (const topic of allTopics) {
    if (topics.length === cfg.topicCount) {
      break;
    }

    console.log(`Topic: ${topic.name}, ${topic.query.text}`);

    const query = new URLSearchParams({ q: topic.query.text });
    if (cfg.market !== undefined) {
      query.set('mkt', cfg.market);
    }
    if (cfg.freshness !== undefined) {
      query.set('freshness', cfg.freshness);
    }

    const results = await api.fetchNewsByQuery(query.toString());

    console.log(`Fetched ${results.length} results`);

    const articles = [];
    for (const result of results) {
      if (articles.length === cfg.articleMaxCount) {
        break;
      }

      console.log(`Scraping ${result.url}...`);

      let data;
      try {
        data = await scrapeDataFromURL(result.url);
      } catch (ex) {
        console.log(`Failed to scrape ${result.url}. Skipping...`);

        continue;
      }

      if (
        !(data && data.textContent.length >= cfg.articleMinLength && data.textContent.length <= cfg.articleMaxLength)
      ) {
        console.log('Data bad. Skipping...');

        continue;
      }

      const isMatch = await ai.isMatch([topic.name, topic.query.text], [result.name, result.description]);
      if (!isMatch) {
        console.log('AI says no match. Skipping...');

        continue;
      }

      articles.push({ result, data });
    }

    console.log(`Gathered ${articles.length} articles`);

    if (articles.length >= cfg.articleMinCount) {
      topics.push({ topic, articles });
    } else {
      console.log('Not enough articles. Next topic...');
    }
  }

  console.log('Writing DB records...');

  const broadcast = await db.broadcast.update({
    where: { id: broadcastID },
    data: {
      topics: {
        create: topics.map(({ topic, articles }) => ({
          name: topic.name,
          query: topic.query.text,
          json: JSON.stringify(topic),
          articles: {
            create: articles.map(({ result, data }) => ({
              name: result.name,
              url: result.url,
              result: JSON.stringify(result),
              data: JSON.stringify(data),
              textContent: data.textContent,
            })),
          },
        })),
      },
    },
    include: { topics: { include: { articles: true } } },
  });

  console.log('DB records written');

  const payload = {
    broadcastID: broadcast.id,
  } satisfies JobPayload['summarize'];
  const job = await db.job.create({
    data: { type: JobType.summarize, payload: JSON.stringify(payload) },
  });

  console.log(
    `Created ${broadcast.topics.length} topics, ${broadcast.topics.reduce(
      (prev, curr) => prev + curr.articles.length,
      0,
    )} articles for broadcast ${broadcast.id}`,
  );
  console.log(`Queued summarize job ${job.id}`);
}
