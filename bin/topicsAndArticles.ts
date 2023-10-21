import { Throttler } from "../utils/throttler";
import { BingNewsAPI } from "../bingNewsAPI/api";
import { getTrendingTopicsAndArticles } from "../articles";

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

const api = new BingNewsAPI(
  BING_NEWS_API_SUBSCRIPTION_KEY,
  new Throttler(BING_NEWS_API_THROTTLE_RPS),
);

const topicsAndArticles = await getTrendingTopicsAndArticles(
  api,
  TOPIC_COUNT,
  ARTICLE_COUNT,
);

console.log(JSON.stringify(topicsAndArticles));
