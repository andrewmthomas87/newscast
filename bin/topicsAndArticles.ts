import { Throttler } from "../utils/throttler";
import { BingNewsAPI } from "../bingNewsAPI/api";
import {
  filterTopicsAndArticles,
  getTrendingTopicsAndArticles,
} from "../articles";
import { db } from "../db";

const BING_NEWS_API_SUBSCRIPTION_KEY =
  process.env.NEWSCAST_BING_NEWS_API_SUBSCRIPTION_KEY;
const BING_NEWS_API_THROTTLE_RPS = parseFloat(
  process.env.NEWSCAST_BING_NEWS_API_THROTTLE_RPS || "",
);
const TOPIC_COUNT = parseInt(process.env.NEWSCAST_TOPIC_COUNT || "5");
const ARTICLE_COUNT = parseInt(process.env.NEWSCAST_ARTICLE_COUNT || "10");

if (!BING_NEWS_API_SUBSCRIPTION_KEY) {
  throw new Error(
    "expected env NEWSCAST_BING_NEWS_API_SUBSCRIPTION_KEY (string)",
  );
} else if (isNaN(BING_NEWS_API_THROTTLE_RPS)) {
  throw new Error("expected env NEWSCAST_BING_NEWS_API_THROTTLE_RPS (number)");
} else if (isNaN(TOPIC_COUNT)) {
  throw new Error("expected env NEWSCAST_TOPIC_COUNT (number)");
} else if (isNaN(ARTICLE_COUNT)) {
  throw new Error("expected env NEWSCAST_ARTICLE_COUNT (number)");
}

const MIN_ARTICLE_LENGTH = 250;
const MAX_ARTICLES = 4;

const api = new BingNewsAPI(
  BING_NEWS_API_SUBSCRIPTION_KEY,
  new Throttler(BING_NEWS_API_THROTTLE_RPS),
);

let topicsAndArticles = await getTrendingTopicsAndArticles(
  api,
  TOPIC_COUNT,
  ARTICLE_COUNT,
);
topicsAndArticles = filterTopicsAndArticles(
  topicsAndArticles,
  MIN_ARTICLE_LENGTH,
  MAX_ARTICLES,
);

const broadcast = await db.broadcast.create({
  data: {
    topics: {
      create: topicsAndArticles.map(({ topic, articles }) => ({
        name: topic.name,
        query: topic.query.text,
        json: JSON.stringify(topic),
        articles: {
          create: articles.map(({ result, data }) => ({
            name: result.name,
            url: result.url,
            result: JSON.stringify(result),
            data: JSON.stringify(data),
            textContent: data?.textContent || "",
          })),
        },
      })),
    },
  },
  include: { topics: { include: { articles: true } } },
});

const articles = broadcast.topics.flatMap(({ articles }) => articles);

console.log(
  `Created ${broadcast.topics.length} topics, ${articles.length} articles`,
);

await db.job.create({
  data: {
    type: "summarize",
    payload: JSON.stringify({ broadcastID: broadcast.id }),
  },
});

console.log(`Queued summarize job for broadcast ${broadcast.id}`);
