export class BingNewsAPI {
  constructor(subscriptionKey, throttler) {
    this.subscriptionKey = subscriptionKey;
    this.throttler = throttler;
  }

  async fetchTrendingTopics() {
    const res = await this.throttler.run(() =>
      fetch("https://api.bing.microsoft.com/v7.0/news/trendingtopics", {
        headers: {
          "Ocp-Apim-Subscription-Key": this.subscriptionKey,
        },
      }),
    );
    if (res.status !== 200) {
      throw res;
    }

    const data = await res.json();

    return data.value;
  }

  async fetchNewsByQuery(query) {
    const res = await this.throttler.run(() =>
      fetch(`https://api.bing.microsoft.com/v7.0/news/search?${query}`, {
        headers: {
          "Ocp-Apim-Subscription-Key": this.subscriptionKey,
        },
      }),
    );
    if (res.status !== 200) {
      throw res;
    }

    const data = await res.json();

    return data.value;
  }
}
