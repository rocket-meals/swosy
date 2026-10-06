/**
 * FoodFeedbackChatHelper.ts – logic of the page "Speise-Feedbacks" in the `Rocket Meals` module.
 *
 * Users can leave a comment with their rating of a dish (`foods_feedbacks.comment`). The page lists
 * those comments and lets backend users answer them in a chat:
 *
 * - A feedback without `chat` has not been answered yet. The first answer creates the chat, adds
 *   the author as participant and links it via `foods_feedbacks.chat` – the same shape the
 *   `app-feedbacks-hook` creates for app feedbacks, so the chat shows up in the app of the author.
 * - Once a chat exists, its `conversation_state` tells whether it waits for support, waits for the
 *   user or is resolved. `chat-conversation-state-hook` keeps it up to date on every message.
 *
 * Plain logic without Vue or Directus app imports, so it can be unit tested in Node.
 */

// Not the package index: this file is bundled into the Directus app, see BackendTranslator.ts.
import { ChatConversationState } from 'repo-depkit-common/src/ChatConversationState';
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';

/** The state of a food feedback from the point of view of support. */
export enum FoodFeedbackChatStatus {
  /** Commented, nobody has answered yet – there is no chat. */
  NEW = 'new',
  WAITING_FOR_SUPPORT = ChatConversationState.WAITING_FOR_SUPPORT,
  WAITING_FOR_USER = ChatConversationState.WAITING_FOR_USER,
  RESOLVED = ChatConversationState.RESOLVED,
}

/** The filters above the list. `open` = everything support still has to look at. */
export enum FoodFeedbackListFilter {
  OPEN = 'open',
  NEW = 'new',
  WAITING_FOR_SUPPORT = 'waiting_for_support',
  WAITING_FOR_USER = 'waiting_for_user',
  RESOLVED = 'resolved',
  ALL = 'all',
}

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

type DirectusFilter = Record<string, unknown>;

/** A comment that only consists of whitespace is no comment. */
const HAS_COMMENT_FILTER: DirectusFilter = { comment: { _nempty: true } };

export class FoodFeedbackChatHelper {
  public static readonly PAGE_SIZE = 25;

  /** Fields of the list. */
  public static readonly LIST_FIELDS = ['id', 'comment', 'rating', 'date_created', 'date_updated', 'food.id', 'food.alias', 'canteen.id', 'canteen.alias', 'profile.id', 'profile.language', 'chat.id', 'chat.conversation_state', 'chat.date_updated'];

  /** Fields of a chat message, including who wrote it in the backend. */
  public static readonly MESSAGE_FIELDS = ['id', 'message', 'date_created', 'profile.id', 'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.email'];

  /** Order of the filter chips. */
  public static readonly FILTERS: readonly FoodFeedbackListFilter[] = [FoodFeedbackListFilter.OPEN, FoodFeedbackListFilter.NEW, FoodFeedbackListFilter.WAITING_FOR_SUPPORT, FoodFeedbackListFilter.WAITING_FOR_USER, FoodFeedbackListFilter.RESOLVED, FoodFeedbackListFilter.ALL];

  static readonly FOOD_FEEDBACKS_ENDPOINT = `/items/${CollectionNames.FOODS_FEEDBACKS}`;
  static readonly CHATS_ENDPOINT = `/items/${CollectionNames.CHATS}`;
  static readonly CHAT_MESSAGES_ENDPOINT = `/items/${CollectionNames.CHAT_MESSAGES}`;
  static readonly CHATS_PARTICIPANTS_ENDPOINT = `/items/${CollectionNames.CHATS_PARTICIPANTS}`;

  static getId(value: { id: string } | string | null | undefined): string | undefined {
    if (!value) {
      return undefined;
    }
    return typeof value === 'string' ? value : value.id;
  }

  /** The status of a feedback; a chat in an unknown state counts as waiting for support. */
  static getStatus(feedback: Pick<FoodFeedbackListItem, 'chat'>): FoodFeedbackChatStatus {
    const chat = feedback.chat;
    if (!chat) {
      return FoodFeedbackChatStatus.NEW;
    }
    const state = typeof chat === 'string' ? undefined : chat.conversation_state;
    switch (state) {
      case ChatConversationState.WAITING_FOR_USER:
        return FoodFeedbackChatStatus.WAITING_FOR_USER;
      case ChatConversationState.RESOLVED:
        return FoodFeedbackChatStatus.RESOLVED;
      default:
        return FoodFeedbackChatStatus.WAITING_FOR_SUPPORT;
    }
  }

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

  static getFilterLabelKey(filter: FoodFeedbackListFilter): BackendTranslationKeys {
    switch (filter) {
      case FoodFeedbackListFilter.OPEN:
        return BackendTranslationKeys.rocket_meals_module_filter_open;
      case FoodFeedbackListFilter.ALL:
        return BackendTranslationKeys.rocket_meals_module_filter_all;
      default:
        return FoodFeedbackChatHelper.getStatusPresentation(filter as unknown as FoodFeedbackChatStatus).labelKey;
    }
  }

  /** The Directus filter for a filter chip – always limited to feedbacks with a comment. */
  static buildFilter(filter: FoodFeedbackListFilter): DirectusFilter {
    const waitingForSupport: DirectusFilter = { chat: { conversation_state: { _eq: ChatConversationState.WAITING_FOR_SUPPORT } } };
    const withoutChat: DirectusFilter = { chat: { _null: true } };

    let statusFilter: DirectusFilter | undefined;
    switch (filter) {
      case FoodFeedbackListFilter.OPEN:
        statusFilter = { _or: [withoutChat, waitingForSupport] };
        break;
      case FoodFeedbackListFilter.NEW:
        statusFilter = withoutChat;
        break;
      case FoodFeedbackListFilter.WAITING_FOR_SUPPORT:
        statusFilter = waitingForSupport;
        break;
      case FoodFeedbackListFilter.WAITING_FOR_USER:
        statusFilter = { chat: { conversation_state: { _eq: ChatConversationState.WAITING_FOR_USER } } };
        break;
      case FoodFeedbackListFilter.RESOLVED:
        statusFilter = { chat: { conversation_state: { _eq: ChatConversationState.RESOLVED } } };
        break;
      case FoodFeedbackListFilter.ALL:
        statusFilter = undefined;
        break;
    }
    return statusFilter ? { _and: [HAS_COMMENT_FILTER, statusFilter] } : { _and: [HAS_COMMENT_FILTER] };
  }

  /** URL parameters of the list request. Newest feedbacks first. */
  static buildListQuery(filter: FoodFeedbackListFilter, page: number, search?: string | null) {
    const query: Record<string, string | number> = {
      fields: FoodFeedbackChatHelper.LIST_FIELDS.join(','),
      filter: JSON.stringify(FoodFeedbackChatHelper.buildFilter(filter)),
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
  static buildCountQuery(filter: FoodFeedbackListFilter) {
    return {
      aggregate: JSON.stringify({ count: ['id'] }),
      filter: JSON.stringify(FoodFeedbackChatHelper.buildFilter(filter)),
    };
  }

  static getPageCount(total: number): number {
    return Math.max(1, Math.ceil(total / FoodFeedbackChatHelper.PAGE_SIZE));
  }

  /** Whether support can answer – without a profile there is nobody to show the chat to. */
  static canStartChat(feedback: Pick<FoodFeedbackListItem, 'profile' | 'chat'>): boolean {
    return !!feedback.chat || !!FoodFeedbackChatHelper.getId(feedback.profile);
  }

  /** The language of the feedback author, as stored in the profile (`de-DE` or `{ code }`). */
  static getAuthorLanguage(feedback: Pick<FoodFeedbackListItem, 'profile'>): string | undefined {
    const profile = feedback.profile;
    if (!profile || typeof profile === 'string') {
      return undefined;
    }
    const language = profile.language;
    if (!language) {
      return undefined;
    }
    return typeof language === 'string' ? language : (language.code ?? undefined);
  }

  /**
   * The new chat for a feedback. `alias` and `initial_message` are shown to the author in the app,
   * hence `alias` in the author's language; the comment opens the conversation like it does for
   * app feedbacks.
   */
  static buildChatForFeedback(feedback: FoodFeedbackListItem, alias: string) {
    return {
      alias,
      initial_message: feedback.comment?.trim() || null,
      conversation_state: ChatConversationState.WAITING_FOR_SUPPORT,
    };
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

  /** Messages with a profile come from an app user; messages without one were written in the backend. */
  static isMessageFromSupport(message: FoodFeedbackChatMessage): boolean {
    return !FoodFeedbackChatHelper.getId(message.profile);
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

  /** Chat messages oldest first, so the conversation reads top to bottom. */
  static sortMessages<T extends FoodFeedbackChatMessage>(messages: T[]): T[] {
    return [...messages].sort((a, b) => (a.date_created ?? '').localeCompare(b.date_created ?? ''));
  }
}
