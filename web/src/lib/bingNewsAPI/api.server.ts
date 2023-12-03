// Bing News API: https://learn.microsoft.com/en-us/rest/api/cognitiveservices-bingsearch/bing-news-api-v7-reference

import { NEWSCAST_BING_NEWS_API_SUBSCRIPTION_KEY, NEWSCAST_BING_NEWS_API_THROTTLE_RPS } from '$env/static/private';
import { Throttler } from '$lib/utils/throttler';
import type { APIErrorResponse, APINews, APITrendingTopics } from './types';

export class BingNewsAPI {
  public subscriptionKey: string;
  public throttler: Throttler;

  constructor(subscriptionKey: string, throttler: Throttler) {
    this.subscriptionKey = subscriptionKey;
    this.throttler = throttler;
  }

  async fetchTrendingTopics() {
    const res = await this.throttler.run(() =>
      fetch('https://api.bing.microsoft.com/v7.0/news/trendingtopics', {
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
      }),
    );
    if (res.status !== 200) {
      throw res;
    }

    const data: APITrendingTopics | APIErrorResponse = await res.json();
    if (data._type !== 'TrendingTopics') {
      throw data;
    }

    return data.value;
  }

  async fetchNewsByQuery(query: string) {
    const res = await this.throttler.run(() =>
      fetch(`https://api.bing.microsoft.com/v7.0/news/search?${query}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
      }),
    );
    if (res.status !== 200) {
      throw res;
    }

    const data: APINews | APIErrorResponse = await res.json();
    if (data._type !== 'News') {
      throw data;
    }

    return data.value;
  }
}

export const bingNewsAPI = new BingNewsAPI(
  NEWSCAST_BING_NEWS_API_SUBSCRIPTION_KEY,
  new Throttler(Number(NEWSCAST_BING_NEWS_API_THROTTLE_RPS)),
);
