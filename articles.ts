import { BingNewsAPI } from "./bingNewsAPI/api";
import { scrapeArticleFromURL } from "./scrape";

export async function getTrendingTopicsAndArticles(
  api: BingNewsAPI,
  topicCount: number,
  articleCount: number,
  mkt = "en-US",
  freshness = "Day",
) {
  let trendingTopics = await api.fetchTrendingTopics();
  trendingTopics = trendingTopics.slice(0, topicCount);

  const results = await Promise.all(
    trendingTopics.map(async (topic) => {
      const query = new URLSearchParams({
        q: topic.query.text,
        mkt,
        count: articleCount.toString(),
        freshness,
      });

      return {
        topic,
        results: await api.fetchNewsByQuery(query.toString()),
      };
    }),
  );

  const topicAndArticles = await Promise.all(
    results.map(async ({ topic, results }) => ({
      topic,
      articles: await Promise.all(
        results.map(async (result) => {
          let data;
          try {
            data = await scrapeArticleFromURL(result.url);
          } catch (ex) {
            console.error(ex);

            data = null;
          }

          return { result, data };
        }),
      ),
    })),
  );

  return topicAndArticles;
}

type TopicsAndArticles = Awaited<
  ReturnType<typeof getTrendingTopicsAndArticles>
>;
export type TopicAndArticles = TopicsAndArticles[number];
export type Article = TopicAndArticles["articles"][number];

export function filterArticles(
  topicsAndArticles: TopicAndArticles[],
  minArticleLength: number,
  maxArticles: number,
) {
  return topicsAndArticles
    .map(({ topic, articles }) => ({
      topic,
      articles: articles.filter(
        ({ data }) =>
          data !== null && data.textContent.length >= minArticleLength,
      ),
    }))
    .map(({ topic, articles }) => ({
      topic,
      articles: articles.slice(0, maxArticles),
    }))
    .filter(({ articles }) => articles.length > 0);
}
