import { AI } from "../ai";
import { TopicAndArticles, filterArticles } from "../articles";
import { Throttler } from "../utils/throttler";

const OPENAI_API_KEY = process.env.NEWSCAST_OPENAI_API_KEY;
const OPENAI_API_MODEL = process.env.NEWSCAST_OPENAI_API_MODEL;
const OPENAI_API_THROTTLE_RPS = parseFloat(
  process.env.NEWSCAST_OPENAI_API_THROTTLE_RPS || "",
);

if (!OPENAI_API_KEY) {
  throw new Error("expected env NEWSCAST_OPENAI_API_KEY (string)");
} else if (!OPENAI_API_MODEL) {
  throw new Error("expected env NEWSCAST_OPENAI_API_MODEL (string)");
} else if (isNaN(OPENAI_API_THROTTLE_RPS)) {
  throw new Error("expected env NEWSCAST_OPENAI_API_THROTTLE_RPS (number)");
}

const MIN_ARTICLE_LENGTH = 250;
const MAX_ARTICLES = 4;

let input = "";
for await (const line of console) {
  input += line;
}
let topicsAndArticles: TopicAndArticles[] = JSON.parse(input);

topicsAndArticles = filterArticles(
  topicsAndArticles,
  MIN_ARTICLE_LENGTH,
  MAX_ARTICLES,
);

const ai = new AI(
  OPENAI_API_KEY,
  OPENAI_API_MODEL,
  new Throttler(OPENAI_API_THROTTLE_RPS),
);

const summaries = await Promise.all(
  topicsAndArticles.map(({ articles }) =>
    Promise.all(articles.map((article) => ai.summarizeArticle(article))),
  ),
);

console.log(JSON.stringify(summaries));
