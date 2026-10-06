import { ChatConversationState } from './ChatConversationState';
import { ChatHelper } from './ChatHelper';
import { RelationHelper, type RelationValue } from './RelationHelper';

/** The state of a food feedback with a comment, from the point of view of support. */
export enum FoodFeedbackChatStatus {
  /** Commented, nobody has answered yet – there is no chat. */
  NEW = 'new',
  WAITING_FOR_SUPPORT = 'waiting_for_support',
  WAITING_FOR_USER = 'waiting_for_user',
  RESOLVED = 'resolved',
}

/** Filters over food feedbacks. `open` = everything support still has to look at. */
export enum FoodFeedbackChatFilter {
  OPEN = 'open',
  NEW = 'new',
  WAITING_FOR_SUPPORT = 'waiting_for_support',
  WAITING_FOR_USER = 'waiting_for_user',
  RESOLVED = 'resolved',
  ALL = 'all',
}

/** Just the fields of a `foods_feedbacks` row the status logic looks at. */
export type FoodFeedbackWithChat = {
  comment?: string | null;
  profile?: { id: string | number; language?: string | { code?: string | null } | null } | string | number | null;
  chat?: { id: string | number; conversation_state?: string | null } | string | number | null;
};

/** A Directus filter object, as the REST API and the SDK take it. */
export type DirectusFilterObject = Record<string, unknown>;

/**
 * Food feedbacks and their support chats (`foods_feedbacks.chat`).
 *
 * A feedback with a comment starts without chat. When support answers, a chat is created for it
 * (same shape as for app feedbacks, see {@link ChatHelper.buildSupportChat}) and linked via
 * `foods_feedbacks.chat`; from then on the chat's `conversation_state` tells where it stands.
 * Used by the backend module "Rocket Meals" and available to the apps for the same view.
 */
export class FoodFeedbackChatStatusHelper {
  /** Order in which filters are offered. */
  public static readonly FILTERS: readonly FoodFeedbackChatFilter[] = [FoodFeedbackChatFilter.OPEN, FoodFeedbackChatFilter.NEW, FoodFeedbackChatFilter.WAITING_FOR_SUPPORT, FoodFeedbackChatFilter.WAITING_FOR_USER, FoodFeedbackChatFilter.RESOLVED, FoodFeedbackChatFilter.ALL];

  /**
   * The states support can set by hand. `new` is not among them: it only means "no chat yet", and
   * a chat, once created, cannot go back to that.
   */
  public static readonly SELECTABLE_STATUSES: readonly FoodFeedbackChatStatus[] = [
    FoodFeedbackChatStatus.WAITING_FOR_SUPPORT,
    FoodFeedbackChatStatus.WAITING_FOR_USER,
    FoodFeedbackChatStatus.RESOLVED,
  ];

  /** The `chats.conversation_state` behind a status, or `undefined` for `new` (= no chat). */
  static getConversationStateForStatus(status: FoodFeedbackChatStatus): ChatConversationState | undefined {
    switch (status) {
      case FoodFeedbackChatStatus.WAITING_FOR_SUPPORT:
        return ChatConversationState.WAITING_FOR_SUPPORT;
      case FoodFeedbackChatStatus.WAITING_FOR_USER:
        return ChatConversationState.WAITING_FOR_USER;
      case FoodFeedbackChatStatus.RESOLVED:
        return ChatConversationState.RESOLVED;
      case FoodFeedbackChatStatus.NEW:
        return undefined;
    }
  }

  /** A comment that only consists of whitespace is no comment. */
  static hasComment(feedback: Pick<FoodFeedbackWithChat, 'comment'>): boolean {
    return (feedback.comment ?? '').trim().length > 0;
  }

  /** The status of a feedback; a chat in an unknown state counts as waiting for support. */
  static getStatus(feedback: Pick<FoodFeedbackWithChat, 'chat'>): FoodFeedbackChatStatus {
    const chat = feedback.chat;
    if (!RelationHelper.isSet(chat as RelationValue)) {
      return FoodFeedbackChatStatus.NEW;
    }
    const state = typeof chat === 'object' && chat !== null ? chat.conversation_state : undefined;
    switch (state) {
      case ChatConversationState.WAITING_FOR_USER:
        return FoodFeedbackChatStatus.WAITING_FOR_USER;
      case ChatConversationState.RESOLVED:
        return FoodFeedbackChatStatus.RESOLVED;
      default:
        return FoodFeedbackChatStatus.WAITING_FOR_SUPPORT;
    }
  }

  /** Whether a feedback matches a filter – the in-memory counterpart of {@link buildFilter}. */
  static matchesFilter(feedback: FoodFeedbackWithChat, filter: FoodFeedbackChatFilter): boolean {
    if (!FoodFeedbackChatStatusHelper.hasComment(feedback)) {
      return false;
    }
    const status = FoodFeedbackChatStatusHelper.getStatus(feedback);
    switch (filter) {
      case FoodFeedbackChatFilter.ALL:
        return true;
      case FoodFeedbackChatFilter.OPEN:
        return status === FoodFeedbackChatStatus.NEW || status === FoodFeedbackChatStatus.WAITING_FOR_SUPPORT;
      default:
        return (status as string) === (filter as string);
    }
  }

  /**
   * The Directus filter for `foods_feedbacks` – always limited to feedbacks with a comment.
   * A chat without state counts as waiting for support in {@link getStatus}, but is not found by
   * the `waiting_for_support` filter; every chat created by the hooks or the module has a state.
   */
  static buildFilter(filter: FoodFeedbackChatFilter): DirectusFilterObject {
    const hasComment: DirectusFilterObject = { comment: { _nempty: true } };
    const withoutChat: DirectusFilterObject = { chat: { _null: true } };
    const inState = (state: ChatConversationState): DirectusFilterObject => ({ chat: { conversation_state: { _eq: state } } });

    let statusFilter: DirectusFilterObject | undefined;
    switch (filter) {
      case FoodFeedbackChatFilter.OPEN:
        statusFilter = { _or: [withoutChat, inState(ChatConversationState.WAITING_FOR_SUPPORT)] };
        break;
      case FoodFeedbackChatFilter.NEW:
        statusFilter = withoutChat;
        break;
      case FoodFeedbackChatFilter.WAITING_FOR_SUPPORT:
        statusFilter = inState(ChatConversationState.WAITING_FOR_SUPPORT);
        break;
      case FoodFeedbackChatFilter.WAITING_FOR_USER:
        statusFilter = inState(ChatConversationState.WAITING_FOR_USER);
        break;
      case FoodFeedbackChatFilter.RESOLVED:
        statusFilter = inState(ChatConversationState.RESOLVED);
        break;
      case FoodFeedbackChatFilter.ALL:
        statusFilter = undefined;
        break;
    }
    return statusFilter ? { _and: [hasComment, statusFilter] } : { _and: [hasComment] };
  }

  /** Whether support can answer – without a profile there is nobody to show the chat to. */
  static canStartChat(feedback: Pick<FoodFeedbackWithChat, 'profile' | 'chat'>): boolean {
    return RelationHelper.isSet(feedback.chat as RelationValue) || RelationHelper.isSet(feedback.profile as RelationValue);
  }

  /** The language of the feedback author, as stored in the profile (`de-DE` or `{ code }`). */
  static getAuthorLanguage(feedback: Pick<FoodFeedbackWithChat, 'profile'>): string | undefined {
    const profile = feedback.profile;
    if (!profile || typeof profile !== 'object') {
      return undefined;
    }
    const language = profile.language;
    if (!language) {
      return undefined;
    }
    return typeof language === 'string' ? language : (language.code ?? undefined);
  }

  /**
   * The chat for a feedback: the comment opens the conversation like it does for app feedbacks.
   * `alias` is the title the author sees in the app – write it in {@link getAuthorLanguage}.
   */
  static buildChatForFeedback(feedback: Pick<FoodFeedbackWithChat, 'comment'>, alias: string) {
    return ChatHelper.buildSupportChat({ alias, initialMessage: feedback.comment });
  }
}
