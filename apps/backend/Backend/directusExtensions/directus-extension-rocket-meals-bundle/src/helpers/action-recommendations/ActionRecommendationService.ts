/**
 * ActionRecommendationService.ts – reads items, asks the AI and stores its recommendations in
 * `action_recommendations`. Shared by the `action-recommendations-endpoint` (on request from the
 * module) and the `action-recommendations-hook` (for every new food feedback).
 *
 * Switched on per server with `app_settings.ai_action_recommendations_enabled` (off by default) and
 * only usable when an OpenAI-compatible provider is configured under Settings → AI.
 */

import { Accountability } from '@directus/types';
import { CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { ApiContext } from '../ApiContext';
import { MyDatabaseHelper } from '../MyDatabaseHelper';
import { DirectusOpenAiCompatibleClient } from '../ai/DirectusOpenAiCompatibleClient';
import { ActionRecommendationModuleHelper } from '../rocket-meals-module/ActionRecommendationModuleHelper';
import { ActionRecommendationDefinitions, ActionRecommendationStatus, OPEN_ACTION_RECOMMENDATION_STATUSES, type ActionRecommendationDefinition } from './ActionRecommendationDefinitions';
import { ActionRecommendationPrompt, ChatReplyRole, type ActionRecommendationSourceItem, type ActionRecommendationSummary, type ChatReplyMessage } from './ActionRecommendationPrompt';
import { ChatHelper } from 'repo-depkit-common/src/ChatHelper';

export type ActionRecommendationResult = { data: Partial<DatabaseTypes.ActionRecommendations>[]; ignored: string[] };

export type ActionRecommendationSummaryResult = ActionRecommendationSummary & { item_count: number; recommended_by_ai: string };

/** Why the AI cannot be asked on this server. */
export enum ActionRecommendationUnavailableReason {
  DISABLED = 'disabled',
  AI_NOT_CONFIGURED = 'ai_not_configured',
}

export class ActionRecommendationService {
  private readonly apiContext: ApiContext;
  private readonly client: DirectusOpenAiCompatibleClient;

  private constructor(apiContext: ApiContext, client: DirectusOpenAiCompatibleClient) {
    this.apiContext = apiContext;
    this.client = client;
  }

  /** Whether a provider is configured under Settings → AI and the automatic recommendations are switched on. */
  static async getStatus(apiContext: ApiContext): Promise<{ ai_configured: boolean; enabled: boolean }> {
    const appSettings = await new MyDatabaseHelper(apiContext).getAppSettingsHelper().getAppSettings();
    const aiConfigured = (await DirectusOpenAiCompatibleClient.fromDirectusSettings(apiContext)) !== null;
    return { ai_configured: aiConfigured, enabled: aiConfigured && appSettings?.ai_action_recommendations_enabled === true };
  }

  /**
   * The service, or why it cannot be used: switched off in the app settings or no AI provider.
   * `requireEnabled: false` skips the app setting, for what someone asks for by hand (a chat reply).
   */
  static async create(apiContext: ApiContext, options: { requireEnabled?: boolean } = {}): Promise<ActionRecommendationService | ActionRecommendationUnavailableReason> {
    if (options.requireEnabled !== false) {
      const appSettings = await new MyDatabaseHelper(apiContext).getAppSettingsHelper().getAppSettings();
      if (!appSettings?.ai_action_recommendations_enabled) {
        return ActionRecommendationUnavailableReason.DISABLED;
      }
    }
    const client = await DirectusOpenAiCompatibleClient.fromDirectusSettings(apiContext);
    return client ? new ActionRecommendationService(apiContext, client) : ActionRecommendationUnavailableReason.AI_NOT_CONFIGURED;
  }

  /**
   * Recommends an action for each of the items. Every item gets its row right away (`processing`, with
   * a log line), so the module shows that the AI is being asked; the answer turns it into a `draft`
   * with the recommendation, or into `failed` with the reason in `logs`. Earlier open AI
   * recommendations of these items are replaced. `accountability` is the person asking (items are
   * read with their permissions and they become `user_created`), `null` for the system. Throws when
   * the AI fails, after the rows were marked as failed.
   */
  async recommend(definition: ActionRecommendationDefinition, ids: readonly string[], language: string, accountability: Accountability | null): Promise<ActionRecommendationResult> {
    if (ids.length === 0) {
      return { data: [], ignored: [] };
    }
    const items = await this.readSourceItems(definition, { id: { _in: [...ids] } }, ids.length, accountability);
    if (items.length === 0) {
      return { data: [], ignored: [] };
    }
    const itemIds = items.map(item => String(item.id));

    // The admin flag lets every role of the module store a recommendation without an extra permission
    // on the table, `user_created` still says who asked.
    const service = await this.getRecommendationsService(accountability ? { ...accountability, admin: true } : null);
    await service.deleteByQuery({
      filter: {
        _and: [
          { collection: { _eq: definition.collection } },
          { item: { _in: itemIds } },
          { status: { _in: [...OPEN_ACTION_RECOMMENDATION_STATUSES] } },
          { recommended_by_ai: { _nnull: true } },
        ],
      },
    });
    const recommendedByAi = this.client.getRecommenderLabel();
    const startLog = ActionRecommendationDefinitions.formatLogLine(new Date(), `Asking the AI (${recommendedByAi}) about ${items.length} item(s)`);
    const keys = await service.createMany(
      itemIds.map(item => ({
        collection: definition.collection,
        item,
        status: ActionRecommendationStatus.PROCESSING,
        recommended_by_ai: recommendedByAi,
        logs: startLog,
      }))
    );

    let parsed: ReturnType<typeof ActionRecommendationPrompt.parseRecommendations>;
    try {
      const replyLanguages = await this.getReplyLanguages(definition, items);
      const answer = await this.client.chatJson(ActionRecommendationPrompt.buildRecommendationPrompt(definition, items, language, replyLanguages));
      parsed = ActionRecommendationPrompt.parseRecommendations(answer, definition, new Set(itemIds));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await service.updateMany(keys, { status: ActionRecommendationStatus.FAILED, logs: `${startLog}\n${ActionRecommendationDefinitions.formatLogLine(new Date(), `The AI failed: ${message}`)}` });
      throw error;
    }
    for (const reason of parsed.ignored) {
      this.apiContext.logger.warn(`action recommendations: ignored part of the AI answer: ${reason}`);
    }

    for (const [index, item] of itemIds.entries()) {
      const key = keys[index];
      const recommendation = parsed.recommendations.find(candidate => candidate.item === item);
      const doneLog = recommendation
        ? ActionRecommendationDefinitions.formatLogLine(new Date(), `The AI recommends "${recommendation.action}"`)
        : ActionRecommendationDefinitions.formatLogLine(new Date(), `No valid recommendation in the answer${parsed.ignored.length > 0 ? ': ' + parsed.ignored.join('; ') : ''}`);
      await service.updateOne(key, { // NOSONAR S9382 - sequential on purpose: one row per item, at most MAX_ITEMS_PER_RECOMMENDATION
        ...(recommendation
          ? { action: recommendation.action, reason: recommendation.reason, draft_reply: recommendation.draft_reply, status: ActionRecommendationStatus.DRAFT }
          : { status: ActionRecommendationStatus.FAILED }),
        logs: `${startLog}\n${doneLog}`,
      });
    }
    const data = await service.readMany(keys, { fields: ActionRecommendationModuleHelper.FIELDS });
    return { data, ignored: parsed.ignored };
  }

  /**
   * Suggests the next message of the support in the chat of an item: the item's text opens the
   * conversation, then the messages, each only with its role (guest or support), never a name. Read
   * with the permissions of the person asking. Null when the item cannot be read. Not stored.
   */
  async suggestChatReply(definition: ActionRecommendationDefinition, itemId: string, accountability: Accountability): Promise<{ draft_reply: string; recommended_by_ai: string } | null> {
    const chat = definition.chat;
    if (!chat) {
      return null;
    }
    const schema = await this.apiContext.getSchema();
    const itemsService = new this.apiContext.services.ItemsService(definition.collection, { schema, accountability });
    const rows = (await itemsService.readByQuery({
      filter: { id: { _eq: itemId } },
      fields: ['id', chat.field, ...definition.textFields, ...chat.contextFields],
      limit: 1,
    })) as ActionRecommendationSourceItem[];
    const item = rows[0];
    if (!item) {
      return null;
    }

    const messages: ChatReplyMessage[] = [];
    const opening = definition.textFields
      .map(field => item[field])
      .filter((text): text is string => typeof text === 'string' && text.trim().length > 0)
      .join('\n\n');
    if (opening) {
      messages.push({ role: ChatReplyRole.GUEST, text: opening });
    }
    const chatId = ActionRecommendationDefinitions.getPathValue(item, chat.field);
    const chatKey = typeof chatId === 'object' && chatId !== null ? (chatId as { id?: unknown }).id : chatId;
    if (typeof chatKey === 'string' || typeof chatKey === 'number') {
      const messagesService = new this.apiContext.services.ItemsService(CollectionNames.CHAT_MESSAGES, { schema, accountability });
      const chatMessages = (await messagesService.readByQuery({
        filter: { chat: { _eq: chatKey } },
        fields: ['message', 'profile'],
        sort: ['-date_created'],
        limit: ActionRecommendationService.MAX_CHAT_MESSAGES,
      })) as { message?: string | null; profile?: unknown }[];
      for (const message of chatMessages.reverse()) {
        if (message.message?.trim()) {
          messages.push({ role: ChatHelper.isSupportMessage({ profile: message.profile as any }) ? ChatReplyRole.SUPPORT : ChatReplyRole.GUEST, text: message.message });
        }
      }
    }

    const context: Record<string, unknown> = {};
    for (const field of chat.contextFields) {
      context[field] = ActionRecommendationDefinitions.getPathValue(item, field);
    }
    const replyLanguage = (await this.getReplyLanguages(definition, [item]))[String(item.id)] ?? ActionRecommendationDefinitions.FALLBACK_REPLY_LANGUAGE;
    const answer = await this.client.chatJson(ActionRecommendationPrompt.buildChatReplyPrompt(chat, context, messages, replyLanguage));
    return { draft_reply: ActionRecommendationPrompt.parseChatReply(answer), recommended_by_ai: this.client.getRecommenderLabel() };
  }

  /** At most this many messages, the newest, are read for a chat reply. */
  static readonly MAX_CHAT_MESSAGES = 50;

  /** Summarizes the newest items with text, optionally only those of one group (e.g. one food). Not stored. */
  async summarize(definition: ActionRecommendationDefinition, groupValue: unknown, language: string, accountability: Accountability | null): Promise<ActionRecommendationSummaryResult | null> {
    const groupField = definition.summaryGroupField;
    const filter = groupField && (typeof groupValue === 'string' || typeof groupValue === 'number') ? { [groupField]: { _eq: groupValue } } : {};
    const items = await this.readSourceItems(definition, filter, ActionRecommendationDefinitions.MAX_ITEMS_PER_SUMMARY, accountability);
    if (items.length === 0) {
      return null;
    }
    const answer = await this.client.chatJson(ActionRecommendationPrompt.buildSummaryPrompt(definition, items, language));
    return { ...ActionRecommendationPrompt.parseSummary(answer), item_count: items.length, recommended_by_ai: this.client.getRecommenderLabel() };
  }

  /**
   * Deletes the recommendations of deleted items, for every collection. `action_recommendations` has
   * no foreign key to the item (it points at any collection), so nothing else would clean up.
   */
  static async deleteForItems(apiContext: ApiContext, collection: string, keys: readonly (string | number)[]): Promise<void> {
    if (keys.length === 0 || !ActionRecommendationService.canHaveRecommendations(collection)) {
      return;
    }
    const service = new apiContext.services.ItemsService(CollectionNames.ACTION_RECOMMENDATIONS, { schema: await apiContext.getSchema(), accountability: null });
    await service.deleteByQuery({ filter: { _and: [{ collection: { _eq: collection } }, { item: { _in: keys.map(String) } }] } });
  }

  /** Directus' own collections and the recommendations themselves never get recommendations. */
  static canHaveRecommendations(collection: unknown): boolean {
    return typeof collection === 'string' && collection.length > 0 && !collection.startsWith('directus_') && collection !== CollectionNames.ACTION_RECOMMENDATIONS;
  }

  /** Reads items with text, only the allowlisted fields, newest first. */
  private async readSourceItems(definition: ActionRecommendationDefinition, filter: Record<string, unknown>, limit: number, accountability: Accountability | null): Promise<ActionRecommendationSourceItem[]> {
    const service = new this.apiContext.services.ItemsService(definition.collection, { schema: await this.apiContext.getSchema(), accountability });
    return (await service.readByQuery({
      filter: { _and: [filter, ActionRecommendationDefinitions.buildHasTextFilter(definition)] },
      fields: ActionRecommendationDefinitions.getReadFields(definition),
      sort: ['-date_created'],
      limit,
    })) as ActionRecommendationSourceItem[];
  }

  /**
   * Per item the language of its draft reply, from the language in the author's profile and the
   * default language of the server. Read without the permissions of the person asking: they may not
   * read profiles, and the language never reaches the AI as more than a language code.
   */
  private async getReplyLanguages(definition: ActionRecommendationDefinition, items: readonly ActionRecommendationSourceItem[]): Promise<Record<string, string>> {
    const defaultLanguage = await this.getDefaultLanguage();
    const authorLanguages: Record<string, string | null> = {};
    if (definition.authorProfileField) {
      try {
        const service = new this.apiContext.services.ItemsService(definition.collection, { schema: await this.apiContext.getSchema(), accountability: null });
        const rows = (await service.readMany(
          items.map(item => item.id),
          { fields: ['id', `${definition.authorProfileField}.language`] }
        )) as Record<string, unknown>[];
        for (const row of rows) {
          authorLanguages[String(row.id)] = ActionRecommendationDefinitions.getAuthorLanguage(definition, row);
        }
      } catch (error) {
        this.apiContext.logger.warn(`action recommendations: reading the languages of the authors failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const replyLanguages: Record<string, string> = {};
    for (const item of items) {
      replyLanguages[String(item.id)] = ActionRecommendationDefinitions.getReplyLanguage(authorLanguages[String(item.id)], defaultLanguage);
    }
    return replyLanguages;
  }

  /** `directus_settings.default_language` (Settings → Project), e.g. `de-DE`; null when it cannot be read. */
  private async getDefaultLanguage(): Promise<string | null> {
    try {
      const settingsService = new this.apiContext.services.SettingsService({ schema: await this.apiContext.getSchema(), accountability: null });
      const settings = (await settingsService.readSingleton({ fields: ['default_language'] })) as { default_language?: unknown } | undefined;
      return typeof settings?.default_language === 'string' ? settings.default_language : null;
    } catch (error) {
      this.apiContext.logger.warn(`action recommendations: reading the default language failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private async getRecommendationsService(accountability: Accountability | null) {
    return new this.apiContext.services.ItemsService(CollectionNames.ACTION_RECOMMENDATIONS, { schema: await this.apiContext.getSchema(), accountability });
  }
}
