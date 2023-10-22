export type APIErrorResponse = {
  _type: 'ErrorResponse';
  errors: Error[];
};

export type APIError = {
  code: string;
  message: string;
  moreDetails?: string;
  parameter?: string;
  subCode?: string;
  value?: string;
};

export type APITrendingTopics = {
  _type: 'TrendingTopics';
  value: APITopic[];
};

export type APINews = {
  _type: 'News';
  id: string;
  readLink: string;
  relatedTopics: unknown;
  sort: unknown;
  totalEstimatedMatches: number;
  value: APINewsArticle[];
};

export type APITopic = {
  image: APIImage;
  isBreakingNews: boolean;
  name: string;
  newsSearchUrl: string;
  query: { text: string };
  webSearchUrl: string;
};

export type APINewsArticle = {
  category: string;
  clusteredArticles: unknown;
  contractualRules: unknown;
  datePublished: string;
  description: string;
  headline: boolean;
  id: string;
  image: APIImage;
  mentions: unknown;
  name: string;
  provider: APIOrganization[];
  url: string;
  video: unknown;
};

export type APIImage = {
  url: string;
  providers: APIOrganization[];
};

export type APIOrganization = {
  _type: 'Organization';
  name: string;
};
