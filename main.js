import { Throttler } from "./utils/throttler";
import { BingNewsAPI } from "./bingNewsAPI";
import { getTrendsAndArticles } from "./articles";

const SUBSCRIPTION_KEY = process.env.NEWSCAST_SUBSCRIPTION_KEY;
const API_THROTTLE_RPS = parseFloat(process.env.NEWSCAST_API_THROTTLE_RPS);

if (!SUBSCRIPTION_KEY) {
  throw new Error("expected env NEWSCAST_SUBSCRIPTION_KEY (string)");
} else if (isNaN(API_THROTTLE_RPS)) {
  throw new Error("expected env NEWSCAST_API_THROTTLE_RPS (number)");
}

const api = new BingNewsAPI(SUBSCRIPTION_KEY, new Throttler(API_THROTTLE_RPS));

const data = await getTrendsAndArticles(5, api);

console.log(data);
