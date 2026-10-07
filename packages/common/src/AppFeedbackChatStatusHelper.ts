import { AppFeedbackContentHelper } from './AppFeedbackContentHelper';
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
 * Values of `app_feedbacks.state`. Only {@link AppFeedbackState.CLOSED} is looked at: it marks a
 * feedback without chat as done – a store review or an anonymous feedback support has nothing to
 * answer to (e.g. a positive one). A feedback with a chat takes its status from the chat.
 */
export enum AppFeedbackState {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
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
 * ({@link FoodFeedbackChatStatus}, {@link FoodFeedbackChatFilter}) – both only look at the linked
 * chat. Unlike a food feedback, an app feedback from a user with a profile gets its chat right
 * away from the `app-feedbacks-hook`; "new" (no chat) is left for older feedbacks or a failed
 * chat creation. Feedbacks without profile – anonymous ones and app store reviews – cannot be
 * answered in a chat. A store review is answered publicly in its store instead
 * (`app_feedbacks.response`): without answer it is "new", with one "waiting for user".
 * A feedback without chat can also be marked as done without any answer
 * (`app_feedbacks.state` = {@link AppFeedbackState.CLOSED}).
 *
 * Used by the `app-feedbacks-hook` and the backend module "Rocket Meals", so both create the chat
 * the same way.
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

  static getStatus(feedback: Pick<AppFeedbackWithChat, 'chat' | 'source_identifier' | 'response' | 'state'>): FoodFeedbackChatStatus {
    if (AppFeedbackChatStatusHelper.isClosedWithoutChat(feedback)) {
      return FoodFeedbackChatStatus.RESOLVED;
    }
    return AppFeedbackChatStatusHelper.getOpenStatus(feedback);
  }

  /** The status a feedback has (again) when it is not marked as done via `state` – the chat or the store answer decides. */
  static getOpenStatus(feedback: Pick<AppFeedbackWithChat, 'chat' | 'source_identifier' | 'response'>): FoodFeedbackChatStatus {
    if (AppFeedbackChatStatusHelper.isStoreReview(feedback)) {
      return (feedback.response ?? '').trim().length > 0 ? FoodFeedbackChatStatus.WAITING_FOR_USER : FoodFeedbackChatStatus.NEW;
    }
    return FoodFeedbackChatStatusHelper.getStatus(feedback);
  }

  /** Whether a feedback matches a filter – the in-memory counterpart of {@link buildFilter}. */
  static matchesFilter(feedback: Pick<AppFeedbackWithChat, 'chat' | 'source_identifier' | 'response' | 'state'>, filter: FoodFeedbackChatFilter): boolean {
    return FoodFeedbackChatStatusHelper.statusMatchesFilter(AppFeedbackChatStatusHelper.getStatus(feedback), filter);
  }

  /** The Directus filter for `app_feedbacks`, `undefined` for all of them. Store reviews never have a chat. */
  static buildFilter(filter: FoodFeedbackChatFilter): DirectusFilterObject | undefined {
    const storeSources = AppFeedbackChatStatusHelper.STORE_SOURCES;
    const withoutChat: DirectusFilterObject = { chat: { _null: true } };
    const storeReview: DirectusFilterObject = { source_identifier: { _in: storeSources } };
    const notStoreReview: DirectusFilterObject = { _or: [{ source_identifier: { _null: true } }, { source_identifier: { _nin: storeSources } }] };
    // `_neq` alone would drop rows without state.
    const notClosed: DirectusFilterObject = { _or: [{ state: { _null: true } }, { state: { _neq: AppFeedbackState.CLOSED } }] };
    const closedWithoutChat: DirectusFilterObject = { _and: [withoutChat, { state: { _eq: AppFeedbackState.CLOSED } }] };
    const newFeedback: DirectusFilterObject = {
      _and: [notClosed, { _or: [{ _and: [notStoreReview, withoutChat] }, { _and: [storeReview, { response: { _empty: true } }] }] }],
    };
    const answeredStoreReview: DirectusFilterObject = { _and: [storeReview, { response: { _nempty: true } }, notClosed] };

    switch (filter) {
      case FoodFeedbackChatFilter.OPEN:
        return { _or: [newFeedback, FoodFeedbackChatStatusHelper.buildStatusFilter(FoodFeedbackChatFilter.WAITING_FOR_SUPPORT)] };
      case FoodFeedbackChatFilter.NEW:
        return newFeedback;
      case FoodFeedbackChatFilter.WAITING_FOR_USER:
        return { _or: [FoodFeedbackChatStatusHelper.buildStatusFilter(filter), answeredStoreReview] };
      case FoodFeedbackChatFilter.RESOLVED:
        return { _or: [FoodFeedbackChatStatusHelper.buildStatusFilter(filter), closedWithoutChat] };
      default:
        return FoodFeedbackChatStatusHelper.buildStatusFilter(filter);
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

  /** Whether a feedback without chat was marked as done via `state`. */
  static isClosedWithoutChat(feedback: Pick<AppFeedbackWithChat, 'chat' | 'state'>): boolean {
    return !RelationHelper.isSet(feedback.chat as RelationValue) && feedback.state === AppFeedbackState.CLOSED;
  }

  /**
   * Whether the status of a feedback is kept in `app_feedbacks.state` instead of a chat: it has no
   * chat and will not get one – a store review, or a feedback without profile.
   */
  static isStatusWithoutChat(feedback: Pick<AppFeedbackWithChat, 'chat' | 'profile' | 'source_identifier'>): boolean {
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
