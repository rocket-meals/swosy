import { AppFeedbackContentHelper } from './AppFeedbackContentHelper';
import { ChatConversationState } from './ChatConversationState';
import { AppFeedbackSourceIdentifier } from './AppFeedbackSourceIdentifier';
import { ChatHelper } from './ChatHelper';
import { type DirectusFilterObject, FoodFeedbackChatFilter, FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from './FoodFeedbackChatStatusHelper';
import { RelationHelper, type RelationValue } from './RelationHelper';

/** Just the fields of an `app_feedbacks` row the status and chat logic looks at. */
export type AppFeedbackWithChat = {
  id: string | number;
  title?: string | null;
  content?: string | null;
  source_identifier?: string | null;
  /** The public answer to a store review. */
  response?: string | null;
  /** Handling state of the feedback itself, see {@link AppFeedbackState}. */
  state?: string | null;
  profile?: { id: string | number } | string | number | null;
  chat?: { id: string | number; conversation_state?: string | null } | string | number | null;
};

/**
 * Values of `app_feedbacks.state` – the status of a feedback, kept on the feedback itself so an
 * export of `app_feedbacks` shows it without looking at the chat. A feedback with a chat mirrors
 * `chats.conversation_state` (both directions, see `chat-conversation-state-hook` and
 * `app-feedbacks-hook`): a message of the user sets {@link WAITING_FOR_SUPPORT}, one of support
 * {@link WAITING_FOR_USER}. Any other value (empty, the former `in_review`) counts as {@link OPEN}.
 */
export enum AppFeedbackState {
  /** Nobody has answered yet. */
  OPEN = 'open',
  /** The user wrote the last message – support has to answer. */
  WAITING_FOR_SUPPORT = 'waiting_for_support',
  /** Support answered. */
  WAITING_FOR_USER = 'waiting_for_user',
  CLOSED = 'closed',
}

/** Where app feedbacks come from – the in-app form or a review pulled from an app store. */
export enum AppFeedbackSourceFilter {
  ALL = 'all',
  APP = 'app',
  APPLE = 'apple',
  GOOGLE_PLAY = 'google_play',
}

/**
 * App feedbacks (`app_feedbacks`) and their support chats (`app_feedbacks.chat`).
 *
 * They use the same statuses and status filters as food feedbacks
 * ({@link FoodFeedbackChatStatus}, {@link FoodFeedbackChatFilter}), but read them from
 * `app_feedbacks.state` only ({@link AppFeedbackState}) – never from the chat. The hooks keep
 * `state` and `chats.conversation_state` in sync. An app feedback from a user with a profile gets
 * its chat right away from the `app-feedbacks-hook`. Feedbacks without profile – anonymous ones
 * and app store reviews – cannot be answered in a chat. A store review is answered publicly in its
 * store instead (`app_feedbacks.response`): an open one with an answer counts as "waiting for user"
 * as well, also for reviews answered before `state` was kept.
 *
 * Used by the hooks and the backend module "Rocket Meals", so both create the chat the same way.
 */
export class AppFeedbackChatStatusHelper {
  public static readonly FILTERS: readonly FoodFeedbackChatFilter[] = FoodFeedbackChatStatusHelper.FILTERS;
  public static readonly SELECTABLE_STATUSES: readonly FoodFeedbackChatStatus[] = FoodFeedbackChatStatusHelper.SELECTABLE_STATUSES;
  public static readonly SOURCE_FILTERS: readonly AppFeedbackSourceFilter[] = [AppFeedbackSourceFilter.ALL, AppFeedbackSourceFilter.APP, AppFeedbackSourceFilter.APPLE, AppFeedbackSourceFilter.GOOGLE_PLAY];

  /** Sources whose feedbacks are app store reviews. */
  public static readonly STORE_SOURCES: readonly AppFeedbackSourceIdentifier[] = [AppFeedbackSourceIdentifier.APPLE, AppFeedbackSourceIdentifier.GOOGLE_PLAY];

  /** The chat title is cut to the length of `chats.alias`. */
  public static readonly CHAT_ALIAS_MAX_LENGTH = 255;
  /** Makes it obvious in the chat list of the app what kind of chat this is. */
  public static readonly CHAT_ALIAS_PREFIX = 'Feedback: ';

  /** The statuses support can set by hand on a feedback that has or can get a chat. */
  public static readonly SELECTABLE_STATUSES_WITH_CHAT: readonly FoodFeedbackChatStatus[] = [FoodFeedbackChatStatus.NEW, ...FoodFeedbackChatStatusHelper.SELECTABLE_STATUSES];

  /** The status of a feedback, read from `app_feedbacks.state` (and the store answer of a store review). */
  static getStatus(feedback: Pick<AppFeedbackWithChat, 'source_identifier' | 'response' | 'state'>): FoodFeedbackChatStatus {
    switch (feedback.state) {
      case AppFeedbackState.CLOSED:
        return FoodFeedbackChatStatus.RESOLVED;
      case AppFeedbackState.WAITING_FOR_SUPPORT:
        return FoodFeedbackChatStatus.WAITING_FOR_SUPPORT;
      case AppFeedbackState.WAITING_FOR_USER:
        return FoodFeedbackChatStatus.WAITING_FOR_USER;
      default:
        return AppFeedbackChatStatusHelper.getOpenStatus(feedback);
    }
  }

  /** The status of an open feedback – an answered store review waits for the user, all others are new. */
  static getOpenStatus(feedback: Pick<AppFeedbackWithChat, 'source_identifier' | 'response'>): FoodFeedbackChatStatus {
    if (AppFeedbackChatStatusHelper.isStoreReview(feedback) && (feedback.response ?? '').trim().length > 0) {
      return FoodFeedbackChatStatus.WAITING_FOR_USER;
    }
    return FoodFeedbackChatStatus.NEW;
  }

  /** The `app_feedbacks.state` behind a status. */
  static getStateForStatus(status: FoodFeedbackChatStatus): AppFeedbackState {
    switch (status) {
      case FoodFeedbackChatStatus.WAITING_FOR_SUPPORT:
        return AppFeedbackState.WAITING_FOR_SUPPORT;
      case FoodFeedbackChatStatus.WAITING_FOR_USER:
        return AppFeedbackState.WAITING_FOR_USER;
      case FoodFeedbackChatStatus.RESOLVED:
        return AppFeedbackState.CLOSED;
      case FoodFeedbackChatStatus.NEW:
        return AppFeedbackState.OPEN;
    }
  }

  /** The `app_feedbacks.state` a feedback takes over from its chat, `undefined` for an unknown chat state. */
  static getStateForConversationState(conversationState: string | null | undefined): AppFeedbackState | undefined {
    switch (conversationState) {
      case ChatConversationState.WAITING_FOR_SUPPORT:
        return AppFeedbackState.WAITING_FOR_SUPPORT;
      case ChatConversationState.WAITING_FOR_USER:
        return AppFeedbackState.WAITING_FOR_USER;
      case ChatConversationState.RESOLVED:
        return AppFeedbackState.CLOSED;
      default:
        return undefined;
    }
  }

  /**
   * The `chats.conversation_state` the chat of a feedback takes over from its `state`. `undefined`
   * for {@link AppFeedbackState.OPEN}: a chat has no "nobody answered yet", it keeps its state.
   */
  static getConversationStateForState(state: string | null | undefined): ChatConversationState | undefined {
    switch (state) {
      case AppFeedbackState.WAITING_FOR_SUPPORT:
        return ChatConversationState.WAITING_FOR_SUPPORT;
      case AppFeedbackState.WAITING_FOR_USER:
        return ChatConversationState.WAITING_FOR_USER;
      case AppFeedbackState.CLOSED:
        return ChatConversationState.RESOLVED;
      default:
        return undefined;
    }
  }

  /** Whether a feedback matches a filter – the in-memory counterpart of {@link buildFilter}. */
  static matchesFilter(feedback: Pick<AppFeedbackWithChat, 'source_identifier' | 'response' | 'state'>, filter: FoodFeedbackChatFilter): boolean {
    return FoodFeedbackChatStatusHelper.statusMatchesFilter(AppFeedbackChatStatusHelper.getStatus(feedback), filter);
  }

  /** The Directus filter for `app_feedbacks`, `undefined` for all of them. Only looks at the feedback itself, never at its chat. */
  static buildFilter(filter: FoodFeedbackChatFilter): DirectusFilterObject | undefined {
    const storeSources = AppFeedbackChatStatusHelper.STORE_SOURCES;
    const storeReview: DirectusFilterObject = { source_identifier: { _in: storeSources } };
    const notStoreReview: DirectusFilterObject = { _or: [{ source_identifier: { _null: true } }, { source_identifier: { _nin: storeSources } }] };
    const inState = (state: AppFeedbackState): DirectusFilterObject => ({ state: { _eq: state } });
    // Everything that is not one of the other states is open – `_nin` alone would drop rows without state.
    const open: DirectusFilterObject = { _or: [{ state: { _null: true } }, { state: { _nin: [AppFeedbackState.WAITING_FOR_SUPPORT, AppFeedbackState.WAITING_FOR_USER, AppFeedbackState.CLOSED] } }] };
    const newFeedback: DirectusFilterObject = { _and: [open, { _or: [notStoreReview, { _and: [storeReview, { response: { _empty: true } }] }] }] };
    const answeredStoreReview: DirectusFilterObject = { _and: [open, storeReview, { response: { _nempty: true } }] };

    switch (filter) {
      case FoodFeedbackChatFilter.OPEN:
        return { _or: [newFeedback, inState(AppFeedbackState.WAITING_FOR_SUPPORT)] };
      case FoodFeedbackChatFilter.NEW:
        return newFeedback;
      case FoodFeedbackChatFilter.WAITING_FOR_SUPPORT:
        return inState(AppFeedbackState.WAITING_FOR_SUPPORT);
      case FoodFeedbackChatFilter.WAITING_FOR_USER:
        return { _or: [inState(AppFeedbackState.WAITING_FOR_USER), answeredStoreReview] };
      case FoodFeedbackChatFilter.RESOLVED:
        return inState(AppFeedbackState.CLOSED);
      case FoodFeedbackChatFilter.ALL:
        return undefined;
    }
  }

  /** The Directus filter of a source, `undefined` for all sources. In-app feedbacks carry no source. */
  static buildSourceFilter(source?: AppFeedbackSourceFilter | null): DirectusFilterObject | undefined {
    switch (source) {
      case AppFeedbackSourceFilter.APP:
        return { _or: [{ source_identifier: { _null: true } }, { source_identifier: { _eq: AppFeedbackSourceIdentifier.APP } }] };
      case AppFeedbackSourceFilter.APPLE:
        return { source_identifier: { _eq: AppFeedbackSourceIdentifier.APPLE } };
      case AppFeedbackSourceFilter.GOOGLE_PLAY:
        return { source_identifier: { _eq: AppFeedbackSourceIdentifier.GOOGLE_PLAY } };
      default:
        return undefined;
    }
  }

  /** Whether a feedback is a review pulled from an app store (answered there, not in a chat). */
  static isStoreReview(feedback: Pick<AppFeedbackWithChat, 'source_identifier'>): boolean {
    return !!feedback.source_identifier && (AppFeedbackChatStatusHelper.STORE_SOURCES as readonly string[]).includes(feedback.source_identifier);
  }

  /** Whether a feedback has no chat and will not get one – a store review, or a feedback without profile. */
  static isWithoutChat(feedback: Pick<AppFeedbackWithChat, 'chat' | 'profile' | 'source_identifier'>): boolean {
    return !RelationHelper.isSet(feedback.chat as RelationValue) && (AppFeedbackChatStatusHelper.isStoreReview(feedback) || !AppFeedbackChatStatusHelper.canStartChat(feedback));
  }

  /** Whether support can answer in a chat – without a profile there is nobody to show the chat to. */
  static canStartChat(feedback: Pick<AppFeedbackWithChat, 'profile' | 'chat'>): boolean {
    return RelationHelper.isSet(feedback.chat as RelationValue) || RelationHelper.isSet(feedback.profile as RelationValue);
  }

  /** The title the author sees in the chat list of the app; the feedback id when there is no title. */
  static getChatAlias(feedback: Pick<AppFeedbackWithChat, 'id' | 'title'>): string {
    const title = (feedback.title || '').trim();
    const alias = AppFeedbackChatStatusHelper.CHAT_ALIAS_PREFIX + (title.length > 0 ? title : String(feedback.id));
    return alias.substring(0, AppFeedbackChatStatusHelper.CHAT_ALIAS_MAX_LENGTH);
  }

  /**
   * The first message of the chat repeats the request, so both sides see right away what the
   * conversation is about. The markdown renderer of the app turns the single newline into a line
   * break, so title and content stay on their own lines. A legacy app state dump in the content is
   * never repeated.
   */
  static getChatInitialMessage(feedback: Pick<AppFeedbackWithChat, 'title' | 'content'>): string {
    const title = (feedback.title || '').trim();
    const content = AppFeedbackContentHelper.stripAppState(feedback.content);
    return `Title: ${title}\nContent: ${content}`;
  }

  /** The chat for a feedback, as the `app-feedbacks-hook` creates it. */
  static buildChatForFeedback(feedback: Pick<AppFeedbackWithChat, 'id' | 'title' | 'content'>) {
    return ChatHelper.buildSupportChat({
      alias: AppFeedbackChatStatusHelper.getChatAlias(feedback),
      initialMessage: AppFeedbackChatStatusHelper.getChatInitialMessage(feedback),
    });
  }
}
