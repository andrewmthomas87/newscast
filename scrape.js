import { fetchNewsByQuery, fetchTrendingTopics } from "./bingNewsAPI";

const SUBSCRIPTION_KEY = process.env.NEWSCAST_SUBSCRIPTION_KEY;

const trendingTopics = await fetchTrendingTopics(SUBSCRIPTION_KEY);

const data = [];
for (const trend of trendingTopics.value) {
  const results = await fetchNewsByQuery(
    SUBSCRIPTION_KEY,
    new URLSearchParams({
      q: `${trend.query.text}+ site:apnews.com`,
      count: 2,
    }).toString()
  );

  data.push({
    trend,
    articles: results.value,
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));
}

console.log(JSON.stringify(data));
