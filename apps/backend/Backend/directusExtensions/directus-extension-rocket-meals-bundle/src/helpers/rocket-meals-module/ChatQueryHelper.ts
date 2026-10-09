/**
 * ChatQueryHelper.ts – how the module `Rocket Meals` reads chats and their messages, in one place:
 * the chat pages of food and app feedbacks, the page "Chats", a single chat and the chats of a
 * profile all build their requests here, with the filters as options instead of hand-written JSON.
 *
 * Plain logic without Vue or Directus app imports, so it can be unit tested in Node.
 */

import { ChatConversationState } from 'repo-depkit-common/src/ChatConversationState';
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { FoodFeedbackChatFilter, FoodFeedbackChatStatus, FoodFeedbackChatStatusHelper } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { RocketMealsModulePages } from './RocketMealsModulePages';
import { ProfileDetailsHelper, type ModuleProfile } from './ProfileDetailsHelper';

type DirectusFilter = Record<string, unknown>;
type Relation = { id: string } | string | number | null | undefined;

/** A chat as the module loads it: participants with their profiles, and the feedback it belongs to, if any. */
export type ModuleChat = {
  id: string;
  alias?: string | null;
  conversation_state?: string | null;
  initial_message?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  participants?: { id?: number | string; profiles_id?: ModuleProfile | string | null }[] | null;
  food_feedbacks?: Relation[] | null;
  app_feedbacks?: Relation[] | null;
};

/** A message as the module shows it, including who wrote it in the backend. */
export type ModuleChatMessage = {
  id: string;
  chat?: string | { id: string } | null;
  message?: string | null;
  date_created?: string | null;
  profile?: ModuleProfile | string | null;
  user_created?: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null } | string | null;
};

/** What a chat is about – decides which page of the module shows it. */
export enum ModuleChatKind {
  FOOD_FEEDBACK = 'food_feedback',
  APP_FEEDBACK = 'app_feedback',
  /** Belongs to no feedback, e.g. started by support from a profile. */
  OTHER = 'other',
}

export type ChatListOptions = {
  /** Only chats this profile takes part in. */
  profileId?: string | null;
  /** Leave out the chats of food and app feedbacks – they have their own pages. */
  withoutFeedbackChats?: boolean;
  /** Only chats in this status; `ALL` or nothing = every status. */
  status?: FoodFeedbackChatFilter | null;
  /** Part of the chat title. */
  search?: string | null;
  limit?: number;
  page?: number;
};

export type ChatQuery = Record<string, string | number>;

export class ChatQueryHelper {
  public static readonly PAGE_SIZE = 25;

  /** The status filters of the page "Chats" – a chat always exists there, so there is no "new". */
  public static readonly STATUS_FILTERS: readonly FoodFeedbackChatFilter[] = [FoodFeedbackChatFilter.OPEN, FoodFeedbackChatFilter.WAITING_FOR_SUPPORT, FoodFeedbackChatFilter.WAITING_FOR_USER, FoodFeedbackChatFilter.RESOLVED, FoodFeedbackChatFilter.ALL];

  static readonly CHATS_ENDPOINT = `/items/${CollectionNames.CHATS}`;
  static readonly CHAT_MESSAGES_ENDPOINT = `/items/${CollectionNames.CHAT_MESSAGES}`;
  static readonly CHATS_PARTICIPANTS_ENDPOINT = `/items/${CollectionNames.CHATS_PARTICIPANTS}`;

  /** Fields of a chat message: the profile with avatar for user messages, the backend user for support messages. */
  public static readonly MESSAGE_FIELDS: readonly string[] = ['id', 'chat', 'message', 'date_created', ...ProfileDetailsHelper.relatedFields('profile'), 'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.email'];

  public static readonly CHAT_FIELDS: readonly string[] = ['id', 'alias', 'conversation_state', 'initial_message', 'date_created', 'date_updated', 'participants.id', ...ProfileDetailsHelper.relatedFields('participants.profiles_id'), 'food_feedbacks.id', 'app_feedbacks.id'];

  /** All messages of a chat, oldest first. */
  static buildMessagesQuery(chatId: string): ChatQuery {
    return {
      fields: ChatQueryHelper.MESSAGE_FIELDS.join(','),
      filter: JSON.stringify({ chat: { _eq: chatId } }),
      sort: 'date_created',
      limit: -1,
    };
  }

  /** The newest message of a chat – the preview in a chat list. */
  static buildLatestMessageQuery(chatId: string): ChatQuery {
    return {
      fields: ChatQueryHelper.MESSAGE_FIELDS.join(','),
      filter: JSON.stringify({ chat: { _eq: chatId } }),
      sort: '-date_created',
      limit: 1,
    };
  }

  static buildChatQuery(): ChatQuery {
    return { fields: ChatQueryHelper.CHAT_FIELDS.join(',') };
  }

  /**
   * The Directus filter of a status on `chats` itself. A chat without state counts as waiting for
   * support (like in `FoodFeedbackChatStatusHelper.getStatus`), so "open" includes it.
   */
  static buildStatusFilter(status?: FoodFeedbackChatFilter | null): DirectusFilter | undefined {
    const inState = (state: ChatConversationState): DirectusFilter => ({ conversation_state: { _eq: state } });
    switch (status) {
      case FoodFeedbackChatFilter.OPEN:
      case FoodFeedbackChatFilter.WAITING_FOR_SUPPORT:
        return { _or: [{ conversation_state: { _null: true } }, inState(ChatConversationState.WAITING_FOR_SUPPORT)] };
      case FoodFeedbackChatFilter.WAITING_FOR_USER:
        return inState(ChatConversationState.WAITING_FOR_USER);
      case FoodFeedbackChatFilter.RESOLVED:
        return inState(ChatConversationState.RESOLVED);
      default:
        return undefined;
    }
  }

  static buildChatsFilter(options: ChatListOptions = {}): DirectusFilter | undefined {
    const parts: DirectusFilter[] = [];
    if (options.withoutFeedbackChats) {
      parts.push({ food_feedbacks: { _none: { id: { _nnull: true } } } }, { app_feedbacks: { _none: { id: { _nnull: true } } } });
    }
    const profileId = options.profileId?.trim();
    if (profileId) {
      parts.push({ participants: { _some: { profiles_id: { _eq: profileId } } } });
    }
    const statusFilter = ChatQueryHelper.buildStatusFilter(options.status);
    if (statusFilter) {
      parts.push(statusFilter);
    }
    const search = options.search?.trim();
    if (search) {
      parts.push({ alias: { _icontains: search } });
    }
    if (parts.length === 0) {
      return undefined;
    }
    return parts.length === 1 ? parts[0] : { _and: parts };
  }

  /** A page of chats, most recently changed first – a new message updates the chat through its state. */
  static buildChatsQuery(options: ChatListOptions = {}): ChatQuery {
    const query: ChatQuery = {
      fields: ChatQueryHelper.CHAT_FIELDS.join(','),
      sort: '-date_updated,-date_created',
      limit: options.limit ?? ChatQueryHelper.PAGE_SIZE,
      page: Math.max(1, options.page ?? 1),
      meta: 'filter_count',
    };
    const filter = ChatQueryHelper.buildChatsFilter(options);
    if (filter) {
      query.filter = JSON.stringify(filter);
    }
    return query;
  }

  static getPageCount(total: number, pageSize: number = ChatQueryHelper.PAGE_SIZE): number {
    return Math.max(1, Math.ceil(total / pageSize));
  }

  private static getRelationId(relation: Relation): string | undefined {
    if (relation === null || relation === undefined || relation === '') {
      return undefined;
    }
    return typeof relation === 'object' ? relation.id || undefined : String(relation);
  }

  private static getFirstId(relations: Relation[] | null | undefined): string | undefined {
    return (relations ?? []).map(relation => ChatQueryHelper.getRelationId(relation)).find(id => !!id);
  }

  static getKind(chat: ModuleChat): ModuleChatKind {
    if (ChatQueryHelper.getFirstId(chat.food_feedbacks)) {
      return ModuleChatKind.FOOD_FEEDBACK;
    }
    if (ChatQueryHelper.getFirstId(chat.app_feedbacks)) {
      return ModuleChatKind.APP_FEEDBACK;
    }
    return ModuleChatKind.OTHER;
  }

  /** Where the chat is answered: the chat page of its feedback, or the page of the chat itself. */
  static getRoute(chat: ModuleChat): string {
    const foodFeedbackId = ChatQueryHelper.getFirstId(chat.food_feedbacks);
    if (foodFeedbackId) {
      return RocketMealsModulePages.getRoute(RocketMealsModulePages.FOOD_FEEDBACKS, foodFeedbackId);
    }
    const appFeedbackId = ChatQueryHelper.getFirstId(chat.app_feedbacks);
    if (appFeedbackId) {
      return RocketMealsModulePages.getRoute(RocketMealsModulePages.APP_FEEDBACKS, appFeedbackId);
    }
    return RocketMealsModulePages.getRoute(RocketMealsModulePages.CHATS, chat.id);
  }

  static getKindIcon(kind: ModuleChatKind): string {
    switch (kind) {
      case ModuleChatKind.FOOD_FEEDBACK:
        return RocketMealsModulePages.FOOD_FEEDBACKS.icon;
      case ModuleChatKind.APP_FEEDBACK:
        return RocketMealsModulePages.APP_FEEDBACKS.icon;
      default:
        return RocketMealsModulePages.CHATS.icon;
    }
  }

  /** The profiles taking part in the chat, as far as they are loaded. */
  static getProfiles(chat: ModuleChat | null | undefined): ModuleProfile[] {
    return (chat?.participants ?? []).map(participant => ProfileDetailsHelper.getProfile(participant.profiles_id)).filter((profile): profile is ModuleProfile => !!profile);
  }

  static getStatus(chat: ModuleChat | null | undefined): FoodFeedbackChatStatus {
    return chat ? FoodFeedbackChatStatusHelper.getStatus({ chat: { id: chat.id, conversation_state: chat.conversation_state } }) : FoodFeedbackChatStatus.NEW;
  }

  static getChatId(message: ModuleChatMessage): string | undefined {
    const chat = message.chat;
    if (!chat) {
      return undefined;
    }
    return typeof chat === 'string' ? chat : chat.id;
  }
}
