/**
 * FoodFeedbackChatHelper.ts – the Directus side of the page "Speise-Feedbacks" in the module
 * `Rocket Meals`: which fields and endpoints it reads, how a status looks (label, icon, colour).
 *
 * The rules themselves – status of a feedback, filters, who may be answered, how a chat is
 * created, who wrote a message – live in `repo-depkit-common` (`FoodFeedbackChatStatusHelper`,
 * `ChatHelper`, `RelationHelper`), so the apps and the hooks use exactly the same ones.
 *
 * Plain logic without Vue or Directus app imports, so it can be unit tested in Node.
 */

// Not the package index: this file is bundled into the Directus app, see BackendTranslator.ts.
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';

export type FoodFeedbackStatusPresentation = {
  labelKey: BackendTranslationKeys;
  icon: string;
  /** A Directus theme colour variable, so the chip works in light and dark mode. */
  color: string;
};

/** The fields the list needs from a feedback, with the relations it expands. */
export type FoodFeedbackListItem = {
  id: string;
  comment?: string | null;
  rating?: number | null;
  date_created?: string | null;
  date_updated?: string | null;
  food?: { id: string; alias?: string | null; image?: string | { id: string } | null; image_remote_url?: string | null } | string | null;
  canteen?: { id: string; alias?: string | null } | string | null;
  profile?: { id: string; language?: string | { code?: string | null } | null } | string | null;
  chat?: { id: string; conversation_state?: string | null; date_updated?: string | null } | string | null;
};

export type FoodFeedbackChatMessage = {
  id: string;
  message?: string | null;
  date_created?: string | null;
  profile?: { id: string } | string | null;
  user_created?: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null } | string | null;
};

/** Order of the list. */
export enum FoodFeedbackListSort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  RATING_WORST = 'rating_worst',
  RATING_BEST = 'rating_best',
}

/** Groups of star ratings the list can be limited to. */
export enum FoodFeedbackRatingFilter {
  ALL = 'all',
  BAD = 'bad',
  MEDIUM = 'medium',
  GOOD = 'good',
  NONE = 'none',
}

/** Everything the list can be narrowed down by, besides the status chips. */
export type FoodFeedbackListOptions = {
  /** Only feedbacks of these canteens; empty = all canteens. */
  canteenIds?: readonly string[] | null;
  /** Part of the food name. */
  foodSearch?: string | null;
  rating?: FoodFeedbackRatingFilter | null;
  sort?: FoodFeedbackListSort | null;
  pageSize?: number | null;
};

type DirectusFilter = Record<string, unknown>;

export class FoodFeedbackChatHelper {
  public static readonly PAGE_SIZE = 25;
  public static readonly PAGE_SIZE_OPTIONS: readonly number[] = [10, 25, 50, 100];

  public static readonly SORTS: readonly FoodFeedbackListSort[] = [FoodFeedbackListSort.NEWEST, FoodFeedbackListSort.OLDEST, FoodFeedbackListSort.RATING_WORST, FoodFeedbackListSort.RATING_BEST];
  public static readonly RATING_FILTERS: readonly FoodFeedbackRatingFilter[] = [FoodFeedbackRatingFilter.ALL, FoodFeedbackRatingFilter.BAD, FoodFeedbackRatingFilter.MEDIUM, FoodFeedbackRatingFilter.GOOD, FoodFeedbackRatingFilter.NONE];

  /** Edge length in px of the food image in the list (requested at twice the size for HiDPI). */
  public static readonly FOOD_IMAGE_SIZE = 64;

  /** Fields of the list. */
  public static readonly LIST_FIELDS = ['id', 'comment', 'rating', 'date_created', 'date_updated', 'food.id', 'food.alias', 'food.image', 'food.image_remote_url', 'canteen.id', 'canteen.alias', 'profile.id', 'profile.language', 'chat.id', 'chat.conversation_state', 'chat.date_updated'];

  /** Fields of a chat message, including who wrote it in the backend. */
  public static readonly MESSAGE_FIELDS = ['id', 'message', 'date_created', 'profile.id', 'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.email'];

  static readonly CANTEENS_ENDPOINT = `/items/${CollectionNames.CANTEENS}`;
  static readonly FOOD_FEEDBACKS_ENDPOINT = `/items/${CollectionNames.FOODS_FEEDBACKS}`;
  static readonly CHATS_ENDPOINT = `/items/${CollectionNames.CHATS}`;
  static readonly CHAT_MESSAGES_ENDPOINT = `/items/${CollectionNames.CHAT_MESSAGES}`;
  static readonly CHATS_PARTICIPANTS_ENDPOINT = `/items/${CollectionNames.CHATS_PARTICIPANTS}`;

  static getStatusPresentation(status: FoodFeedbackChatStatus): FoodFeedbackStatusPresentation {
    switch (status) {
      case FoodFeedbackChatStatus.NEW:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_status_new, icon: 'fiber_new', color: 'var(--theme--primary)' };
      case FoodFeedbackChatStatus.WAITING_FOR_SUPPORT:
        return {
          labelKey: BackendTranslationKeys.rocket_meals_module_status_waiting_for_support,
          icon: 'schedule',
          color: 'var(--theme--warning)',
        };
      case FoodFeedbackChatStatus.WAITING_FOR_USER:
        return {
          labelKey: BackendTranslationKeys.rocket_meals_module_status_waiting_for_user,
          icon: 'mark_chat_read',
          color: 'var(--theme--success)',
        };
      case FoodFeedbackChatStatus.RESOLVED:
        return {
          labelKey: BackendTranslationKeys.rocket_meals_module_status_resolved,
          icon: 'task_alt',
          color: 'var(--theme--foreground-subdued)',
        };
    }
  }

  static getFilterLabelKey(filter: FoodFeedbackChatFilter): BackendTranslationKeys {
    switch (filter) {
      case FoodFeedbackChatFilter.OPEN:
        return BackendTranslationKeys.rocket_meals_module_filter_open;
      case FoodFeedbackChatFilter.ALL:
        return BackendTranslationKeys.rocket_meals_module_filter_all;
      default:
        return FoodFeedbackChatHelper.getStatusPresentation(filter as unknown as FoodFeedbackChatStatus).labelKey;
    }
  }

  /** The Directus `sort` of an order; ties are broken by date, newest first. */
  static getSortParameter(sort?: FoodFeedbackListSort | null): string {
    switch (sort) {
      case FoodFeedbackListSort.OLDEST:
        return 'date_created';
      case FoodFeedbackListSort.RATING_WORST:
        return 'rating,-date_created';
      case FoodFeedbackListSort.RATING_BEST:
        return '-rating,-date_created';
      default:
        return '-date_created';
    }
  }

  /** The Directus filter of a rating group (stars 1–5), `undefined` for all ratings. */
  static buildRatingFilter(rating?: FoodFeedbackRatingFilter | null): DirectusFilter | undefined {
    switch (rating) {
      case FoodFeedbackRatingFilter.BAD:
        return { rating: { _between: [1, 2] } };
      case FoodFeedbackRatingFilter.MEDIUM:
        return { rating: { _eq: 3 } };
      case FoodFeedbackRatingFilter.GOOD:
        return { rating: { _between: [4, 5] } };
      case FoodFeedbackRatingFilter.NONE:
        return { rating: { _null: true } };
      default:
        return undefined;
    }
  }

  /** The status filter combined with canteen, food and rating of the options. */
  static buildFilter(filter: FoodFeedbackChatFilter, options: FoodFeedbackListOptions = {}): DirectusFilter {
    const parts: DirectusFilter[] = [FoodFeedbackChatStatusHelper.buildFilter(filter)];
    const canteenIds = (options.canteenIds ?? []).filter(id => !!id);
    if (canteenIds.length > 0) {
      parts.push({ canteen: { _in: canteenIds } });
    }
    const foodSearch = options.foodSearch?.trim();
    if (foodSearch) {
      parts.push({ food: { alias: { _icontains: foodSearch } } });
    }
    const ratingFilter = FoodFeedbackChatHelper.buildRatingFilter(options.rating);
    if (ratingFilter) {
      parts.push(ratingFilter);
    }
    return parts.length === 1 ? parts[0]! : { _and: parts };
  }

  /** A page size from the offered options, else the default. */
  static getPageSize(pageSize?: number | null): number {
    return pageSize && FoodFeedbackChatHelper.PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : FoodFeedbackChatHelper.PAGE_SIZE;
  }

  /** URL parameters of the list request. Newest feedbacks first unless sorted otherwise. */
  static buildListQuery(filter: FoodFeedbackChatFilter, page: number, search?: string | null, options: FoodFeedbackListOptions = {}) {
    const query: Record<string, string | number> = {
      fields: FoodFeedbackChatHelper.LIST_FIELDS.join(','),
      filter: JSON.stringify(FoodFeedbackChatHelper.buildFilter(filter, options)),
      sort: FoodFeedbackChatHelper.getSortParameter(options.sort),
      limit: FoodFeedbackChatHelper.getPageSize(options.pageSize),
      page: Math.max(1, page),
      meta: 'filter_count',
    };
    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      query.search = trimmedSearch;
    }
    return query;
  }

  /** URL parameters to count the feedbacks of one filter chip – with the same canteen, food and rating filter as the list. */
  static buildCountQuery(filter: FoodFeedbackChatFilter, options: FoodFeedbackListOptions = {}, search?: string | null) {
    const query: Record<string, string> = {
      aggregate: JSON.stringify({ count: ['id'] }),
      filter: JSON.stringify(FoodFeedbackChatHelper.buildFilter(filter, options)),
    };
    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      query.search = trimmedSearch;
    }
    return query;
  }

  /** URL parameters to load the canteens for the canteen filter. */
  static buildCanteensQuery() {
    return { fields: 'id,alias', sort: 'sort,alias', limit: -1 };
  }

  static getPageCount(total: number, pageSize?: number | null): number {
    return Math.max(1, Math.ceil(total / FoodFeedbackChatHelper.getPageSize(pageSize)));
  }

  static getSortLabelKey(sort: FoodFeedbackListSort): BackendTranslationKeys {
    switch (sort) {
      case FoodFeedbackListSort.NEWEST:
        return BackendTranslationKeys.rocket_meals_module_sort_newest;
      case FoodFeedbackListSort.OLDEST:
        return BackendTranslationKeys.rocket_meals_module_sort_oldest;
      case FoodFeedbackListSort.RATING_WORST:
        return BackendTranslationKeys.rocket_meals_module_sort_rating_worst;
      case FoodFeedbackListSort.RATING_BEST:
        return BackendTranslationKeys.rocket_meals_module_sort_rating_best;
    }
  }

  static getRatingFilterLabelKey(rating: FoodFeedbackRatingFilter): BackendTranslationKeys {
    switch (rating) {
      case FoodFeedbackRatingFilter.ALL:
        return BackendTranslationKeys.rocket_meals_module_rating_all;
      case FoodFeedbackRatingFilter.BAD:
        return BackendTranslationKeys.rocket_meals_module_rating_bad;
      case FoodFeedbackRatingFilter.MEDIUM:
        return BackendTranslationKeys.rocket_meals_module_rating_medium;
      case FoodFeedbackRatingFilter.GOOD:
        return BackendTranslationKeys.rocket_meals_module_rating_good;
      case FoodFeedbackRatingFilter.NONE:
        return BackendTranslationKeys.rocket_meals_module_rating_none;
    }
  }

  /**
   * The URL of the food image: the Directus file (as thumbnail, relative to the app's API root –
   * the session cookie authorises it), else the remote URL of the food, else `undefined`.
   */
  static getFoodImageUrl(feedback: Pick<FoodFeedbackListItem, 'food'>, apiRoot: string = '/'): string | undefined {
    const food = feedback.food;
    if (!food || typeof food === 'string') {
      return undefined;
    }
    const fileId = typeof food.image === 'object' && food.image !== null ? food.image.id : food.image;
    if (fileId) {
      const root = apiRoot.endsWith('/') ? apiRoot : `${apiRoot}/`;
      const size = FoodFeedbackChatHelper.FOOD_IMAGE_SIZE * 2;
      return `${root}assets/${encodeURIComponent(fileId)}?width=${size}&height=${size}&fit=cover&quality=80`;
    }
    return food.image_remote_url || undefined;
  }

  /** Whether a feedback can be marked as done from the list: not done yet, and someone to show the chat to. */
  static canMarkResolved(feedback: FoodFeedbackListItem): boolean {
    return FoodFeedbackChatStatusHelper.getStatus(feedback) !== FoodFeedbackChatStatus.RESOLVED && FoodFeedbackChatStatusHelper.canStartChat(feedback);
  }

  static getFoodName(feedback: Pick<FoodFeedbackListItem, 'food'>): string | undefined {
    const food = feedback.food;
    if (!food) {
      return undefined;
    }
    return typeof food === 'string' ? food : food.alias || food.id;
  }

  static getCanteenName(feedback: Pick<FoodFeedbackListItem, 'canteen'>): string | undefined {
    const canteen = feedback.canteen;
    if (!canteen) {
      return undefined;
    }
    return typeof canteen === 'string' ? canteen : canteen.alias || canteen.id;
  }

  /** The name of the backend user who wrote a support message, if known. */
  static getSupportAuthorName(message: FoodFeedbackChatMessage): string | undefined {
    const user = message.user_created;
    if (!user || typeof user === 'string') {
      return undefined;
    }
    const name = [user.first_name, user.last_name].filter(part => !!part && part.trim().length > 0).join(' ');
    return name || user.email || undefined;
  }
}
