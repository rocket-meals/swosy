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
  food?: { id: string; alias?: string | null } | string | null;
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

export class FoodFeedbackChatHelper {
  public static readonly PAGE_SIZE = 25;

  /** Fields of the list. */
  public static readonly LIST_FIELDS = ['id', 'comment', 'rating', 'date_created', 'date_updated', 'food.id', 'food.alias', 'canteen.id', 'canteen.alias', 'profile.id', 'profile.language', 'chat.id', 'chat.conversation_state', 'chat.date_updated'];

  /** Fields of a chat message, including who wrote it in the backend. */
  public static readonly MESSAGE_FIELDS = ['id', 'message', 'date_created', 'profile.id', 'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.email'];

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

  /** URL parameters of the list request. Newest feedbacks first. */
  static buildListQuery(filter: FoodFeedbackChatFilter, page: number, search?: string | null) {
    const query: Record<string, string | number> = {
      fields: FoodFeedbackChatHelper.LIST_FIELDS.join(','),
      filter: JSON.stringify(FoodFeedbackChatStatusHelper.buildFilter(filter)),
      sort: '-date_created',
      limit: FoodFeedbackChatHelper.PAGE_SIZE,
      page: Math.max(1, page),
      meta: 'filter_count',
    };
    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      query.search = trimmedSearch;
    }
    return query;
  }

  /** URL parameters to count the feedbacks of one filter chip. */
  static buildCountQuery(filter: FoodFeedbackChatFilter) {
    return {
      aggregate: JSON.stringify({ count: ['id'] }),
      filter: JSON.stringify(FoodFeedbackChatStatusHelper.buildFilter(filter)),
    };
  }

  static getPageCount(total: number): number {
    return Math.max(1, Math.ceil(total / FoodFeedbackChatHelper.PAGE_SIZE));
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
