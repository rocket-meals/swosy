import { FetchHelper } from './FetchHelper';

export type AppleRssReviewEntry = {
  author: { name: { label: string }; uri: { label: string } };
  'im:version': { label: string };
  'im:rating': { label: string };
  id: { label: string };
  title: { label: string };
  content: { label: string; attributes: { type: string } };
  'im:voteSum': { label: string };
  'im:contentType': { label: string; attributes: { term: string; label: string } };
  'im:voteCount': { label: string };
  link: { attributes: { rel: string; href: string } };
};

export type AppleRssFeedResponse = {
  feed: {
    author: unknown;
    entry?: AppleRssReviewEntry[];
    updated: { label: string };
    rights: { label: string };
    title: { label: string };
    icon: { label: string };
    link: unknown[];
    id: { label: string };
  };
};

export class AppleAppStoreRssHelper {
  static async fetchReviews(appId: string, page = 1): Promise<AppleRssFeedResponse> {
    const url = `https://itunes.apple.com/de/rss/customerreviews/page=${page}/id=${appId}/sortBy=mostRecent/json`;
    const response = await FetchHelper.fetch(url, {
      headers: { 'Content-Type': 'application/json' },
    });
    const json = (await response.json()) as AppleRssFeedResponse;
    console.log('[AppleAppStoreRssHelper] fetchReviews raw response:', JSON.stringify(json, null, 2));
    return json;
  }

  static getReviewId(entry: AppleRssReviewEntry): string {
    return entry.id.label;
  }

  static getReviewRating(entry: AppleRssReviewEntry): number {
    return parseInt(entry['im:rating'].label, 10);
  }

  static getReviewTitle(entry: AppleRssReviewEntry): string {
    return entry.title.label;
  }

  static getReviewBody(entry: AppleRssReviewEntry): string {
    return entry.content.label;
  }

  static getReviewAuthor(entry: AppleRssReviewEntry): string {
    return entry.author.name.label;
  }
}
