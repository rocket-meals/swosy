/**
 * OpenCountHelper.ts – the badges on the overview page of the module `Rocket Meals`: how many food
 * feedbacks, app feedbacks and other chats still wait for support.
 *
 * "Open" means the same as the filter chip "Offen" on each page (new or waiting for support), with
 * the default filters of that page, so the badge matches what the page lists when it is opened.
 *
 * Plain logic without Vue or Directus app imports, so it can be unit tested in Node.
 */

// Not the package index: this file is bundled into the Directus app, see BackendTranslator.ts.
import { FoodFeedbackChatFilter } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { AppFeedbackChatHelper } from './AppFeedbackChatHelper';
import { ChatQueryHelper } from './ChatQueryHelper';
import { FoodFeedbackChatHelper } from './FoodFeedbackChatHelper';
import { RocketMealsModulePages, type RocketMealsModulePage } from './RocketMealsModulePages';

/** One count request: the endpoint and the URL parameters of a Directus `aggregate` request. */
export type OpenCountRequest = {
  endpoint: string;
  params: Record<string, string>;
};

export class OpenCountHelper {
  /** Larger counts are shown as `99+`, so the badge stays small. */
  public static readonly MAX_DISPLAYED_COUNT = 99;

  /** The count request of a page, `undefined` for pages without open items. */
  static getRequest(page: RocketMealsModulePage): OpenCountRequest | undefined {
    switch (page.path) {
      case RocketMealsModulePages.FOOD_FEEDBACKS.path:
        return { endpoint: FoodFeedbackChatHelper.FOOD_FEEDBACKS_ENDPOINT, params: FoodFeedbackChatHelper.buildCountQuery(FoodFeedbackChatFilter.OPEN) };
      case RocketMealsModulePages.APP_FEEDBACKS.path:
        return { endpoint: AppFeedbackChatHelper.APP_FEEDBACKS_ENDPOINT, params: AppFeedbackChatHelper.buildCountQuery(FoodFeedbackChatFilter.OPEN) };
      case RocketMealsModulePages.CHATS.path:
        return { endpoint: ChatQueryHelper.CHATS_ENDPOINT, params: OpenCountHelper.buildOpenChatsCountQuery() };
      default:
        return undefined;
    }
  }

  /** Chats of no feedback that wait for support – like the page "Chats" with the filter "Offen". */
  static buildOpenChatsCountQuery(): Record<string, string> {
    const filter = ChatQueryHelper.buildChatsFilter({ withoutFeedbackChats: true, status: FoodFeedbackChatFilter.OPEN });
    return {
      aggregate: JSON.stringify({ count: ['id'] }),
      filter: JSON.stringify(filter),
    };
  }

  /** The count out of a Directus `aggregate` response body, `undefined` when it holds none. */
  static parseCount(body: unknown): number | undefined {
    const data = (body as { data?: { count?: { id?: unknown } | unknown }[] } | null | undefined)?.data;
    const raw = data?.[0]?.count;
    const value = typeof raw === 'object' && raw !== null ? (raw as { id?: unknown }).id : raw;
    const count = Number(value);
    return value !== undefined && value !== null && Number.isFinite(count) ? count : undefined;
  }

  /** The text of the badge, e.g. `3` or `99+`; `undefined` when there is nothing open. */
  static getBadgeText(count: number | undefined): string | undefined {
    if (count === undefined || count <= 0) {
      return undefined;
    }
    return count > OpenCountHelper.MAX_DISPLAYED_COUNT ? `${OpenCountHelper.MAX_DISPLAYED_COUNT}+` : String(count);
  }
}
