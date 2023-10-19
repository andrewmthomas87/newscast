export async function getTrendsAndArticles(trendCount, api) {
  let trendingTopics = await api.fetchTrendingTopics();
  trendingTopics = trendingTopics.slice(0, trendCount);

  const data = [];
  for (const trend of trendingTopics) {
    const query = new URLSearchParams({
      q: trend.query.text,
      freshness: "Day",
    }).toString();
    const articles = await api.fetchNewsByQuery(query);

    data.push({
      trend,
      articles,
    });
  }

  return data;
}
