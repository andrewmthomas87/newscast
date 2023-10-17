export async function fetchTrendingTopics(subscriptionKey) {
  const res = await fetch(
    "https://api.bing.microsoft.com/v7.0/news/trendingtopics",
    {
      headers: {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      },
    }
  );
  return await res.json();
}

export async function fetchNewsByQuery(subscriptionKey, query) {
  const res = await fetch(
    `https://api.bing.microsoft.com/v7.0/news/search?q=${query}`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      },
    }
  );
  return await res.json();
}
