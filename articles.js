import { scrapeArticleFromURL } from "./scrape";

export async function getTrendingArticles(
  api,
  topicCount,
  articleCount,
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
        count: articleCount,
        freshness,
      });

      return {
        topic,
        results: await api.fetchNewsByQuery(query),
      };
    }),
  );

  const articles = await Promise.all(
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

  return articles;
}

export function filterArticles(articles, minArticleLength, maxArticles) {
  return articles
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
