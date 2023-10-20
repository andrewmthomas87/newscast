import { Throttler } from "../utils/throttler";
import { BingNewsAPI } from "../bingNewsAPI";
import { getTrendingArticles } from "../articles";

const SUBSCRIPTION_KEY = process.env.NEWSCAST_SUBSCRIPTION_KEY;
const API_THROTTLE_RPS = parseFloat(process.env.NEWSCAST_API_THROTTLE_RPS);
const TOPIC_COUNT = parseInt(process.env.NEWSCAST_TOPIC_COUNT || "5");
const ARTICLE_COUNT = parseInt(process.env.NEWSCAST_ARTICLE_COUNT || "10");

if (!SUBSCRIPTION_KEY) {
  throw new Error("expected env NEWSCAST_SUBSCRIPTION_KEY (string)");
} else if (isNaN(API_THROTTLE_RPS)) {
  throw new Error("expected env NEWSCAST_API_THROTTLE_RPS (number)");
} else if (isNaN(TOPIC_COUNT)) {
  throw new Error("expected env NEWSCAST_TOPIC_COUNT (number)");
} else if (isNaN(ARTICLE_COUNT)) {
  throw new Error("expected env NEWSCAST_ARTICLE_COUNT (number)");
}

const api = new BingNewsAPI(SUBSCRIPTION_KEY, new Throttler(API_THROTTLE_RPS));

const articles = await getTrendingArticles(api, TOPIC_COUNT, ARTICLE_COUNT);

console.log(JSON.stringify(articles));
