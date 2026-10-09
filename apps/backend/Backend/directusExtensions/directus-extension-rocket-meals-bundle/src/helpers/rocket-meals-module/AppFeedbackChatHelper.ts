/**
 * AppFeedbackChatHelper.ts – the Directus side of the page "App-Feedbacks" in the module
 * `Rocket Meals`: which fields and endpoints it reads, how the list is filtered and sorted.
 *
 * The rules themselves – status of a feedback, status and source filters, who may be answered,
 * how a chat is created – live in `repo-depkit-common` (`AppFeedbackChatStatusHelper`,
 * `ChatHelper`), so the `app-feedbacks-hook` creates chats exactly the same way. Status chips and
 * chat messages look like on the page "Speise-Feedbacks" (`FoodFeedbackChatHelper`).
 *
 * Plain logic without Vue or Directus app imports, so it can be unit tested in Node.
 */

// Not the package index: this file is bundled into the Directus app, see BackendTranslator.ts.
import { AppFeedbackChatStatusHelper, AppFeedbackSourceFilter } from 'repo-depkit-common/src/AppFeedbackChatStatusHelper';
import { AppFeedbackContentHelper } from 'repo-depkit-common/src/AppFeedbackContentHelper';
import { AppFeedbackSourceIdentifier } from 'repo-depkit-common/src/AppFeedbackSourceIdentifier';
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { EmailHelper } from 'repo-depkit-common/src/EmailHelper';
import { type FoodFeedbackChatFilter, FoodFeedbackChatStatus } from 'repo-depkit-common/src/FoodFeedbackChatStatusHelper';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';
import { FoodFeedbackChatHelper, FoodFeedbackListSort } from './FoodFeedbackChatHelper';

/** The fields the list and the chat need from an app feedback, with the relations it expands. */
export type AppFeedbackListItem = {
  id: string;
  title?: string | null;
  content?: string | null;
  /** Some databases (SQLite) hand booleans out as `0` / `1`. */
  positive?: boolean | number | null;
  contact_email?: string | null;
  source_identifier?: string | null;
  source_rating_raw?: number | null;
  /** The public answer to a store review; setting it publishes it in the store (`app-reviews-pull-hook`). */
  response?: string | null;
  /** `closed` marks a feedback without chat as done, see `AppFeedbackState`. */
  state?: string | null;
  device_platform?: string | null;
  device_brand?: string | null;
  device_system_version?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  profile?: { id: string; nickname?: string | null } | string | null;
  chat?: { id: string; conversation_state?: string | null; date_updated?: string | null } | string | null;
};

/** Thumbs up or down, as the user chose it in the app (store reviews: 4–5 stars count as positive). */
export enum AppFeedbackTypeFilter {
  ALL = 'all',
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}

/** Everything the list can be narrowed down by, besides the status chips. */
export type AppFeedbackListOptions = {
  /** Only feedbacks from one of these sources; empty = all sources. */
  sources?: readonly AppFeedbackSourceFilter[] | null;
  /** Only feedbacks with one of these thumbs; empty = all, also those without thumb. */
  types?: readonly AppFeedbackTypeFilter[] | null;
  sort?: FoodFeedbackListSort | null;
  pageSize?: number | null;
};

/**
 * How support answers a feedback:
 * - `store` – a store review, answered publicly in the store via `response`.
 * - `chat` – the author has a profile (or there is a chat already), answered in the chat of the app.
 * - `mail` – no profile but a contact email: one answer in `response`, the `app-feedbacks-hook` mails it.
 * - `none` – anonymous without contact email: nobody to answer, it can only be marked as done.
 */
export enum AppFeedbackAnswerChannel {
  STORE = 'store',
  CHAT = 'chat',
  MAIL = 'mail',
  NONE = 'none',
}

type DirectusFilter = Record<string, unknown>;

export class AppFeedbackChatHelper {
  /** App feedbacks can only be ordered by date – they have no rating of their own. */
  public static readonly SORTS: readonly FoodFeedbackListSort[] = [FoodFeedbackListSort.NEWEST, FoodFeedbackListSort.OLDEST];
  public static readonly TYPE_FILTERS: readonly AppFeedbackTypeFilter[] = [AppFeedbackTypeFilter.ALL, AppFeedbackTypeFilter.POSITIVE, AppFeedbackTypeFilter.NEGATIVE];
  /** The sources that can be ticked in the source filter – none ticked means all. */
  public static readonly SELECTABLE_SOURCES: readonly AppFeedbackSourceFilter[] = AppFeedbackChatStatusHelper.SOURCE_FILTERS.filter(source => source !== AppFeedbackSourceFilter.ALL);
  /** Thumbs up / down that can be ticked in the type filter – none ticked means all. */
  public static readonly SELECTABLE_TYPES: readonly AppFeedbackTypeFilter[] = AppFeedbackChatHelper.TYPE_FILTERS.filter(type => type !== AppFeedbackTypeFilter.ALL);

  /** Fields of the list and the chat page. */
  public static readonly LIST_FIELDS = ['id', 'title', 'content', 'positive', 'contact_email', 'source_identifier', 'source_rating_raw', 'response', 'state', 'device_platform', 'device_brand', 'device_system_version', 'date_created', 'date_updated', 'profile.id', 'profile.nickname', 'chat.id', 'chat.conversation_state', 'chat.date_updated'];

  static readonly APP_FEEDBACKS_ENDPOINT = `/items/${CollectionNames.APP_FEEDBACKS}`;

  /** The Directus filter of thumbs up / down, `undefined` for both. */
  static buildTypeFilter(type?: AppFeedbackTypeFilter | null): DirectusFilter | undefined {
    switch (type) {
      case AppFeedbackTypeFilter.POSITIVE:
        return { positive: { _eq: true } };
      case AppFeedbackTypeFilter.NEGATIVE:
        return { positive: { _eq: false } };
      default:
        return undefined;
    }
  }

  /** The known, ticked sources in the order of the filter; `ALL` and unknown values are dropped. */
  static getSources(sources?: readonly unknown[] | null): AppFeedbackSourceFilter[] {
    const selected = Array.isArray(sources) ? sources : [];
    return AppFeedbackChatHelper.SELECTABLE_SOURCES.filter(source => selected.includes(source));
  }

  /** The known, ticked thumbs in the order of the filter; `ALL` and unknown values are dropped. */
  static getTypes(types?: readonly unknown[] | null): AppFeedbackTypeFilter[] {
    const selected = Array.isArray(types) ? types : [];
    return AppFeedbackChatHelper.SELECTABLE_TYPES.filter(type => selected.includes(type));
  }

  /** Any of the given parts; `undefined` when none applies or all `selectableCount` options are ticked. */
  private static buildAnyFilter(parts: (DirectusFilter | undefined)[], selectableCount: number): DirectusFilter | undefined {
    const filters = parts.filter((part): part is DirectusFilter => !!part);
    if (filters.length === 0 || parts.length >= selectableCount) {
      return undefined;
    }
    return filters.length === 1 ? filters[0]! : { _or: filters };
  }

  /** The Directus filter of the ticked sources, `undefined` for all sources. */
  static buildSourcesFilter(sources?: readonly AppFeedbackSourceFilter[] | null): DirectusFilter | undefined {
    const selected = AppFeedbackChatHelper.getSources(sources);
    return AppFeedbackChatHelper.buildAnyFilter(
      selected.map(source => AppFeedbackChatStatusHelper.buildSourceFilter(source)),
      AppFeedbackChatHelper.SELECTABLE_SOURCES.length
    );
  }

  /**
   * The Directus filter of the ticked thumbs, `undefined` for none ticked. Both ticked still
   * leaves out feedbacks without thumb – they match neither.
   */
  static buildTypesFilter(types?: readonly AppFeedbackTypeFilter[] | null): DirectusFilter | undefined {
    const parts = AppFeedbackChatHelper.getTypes(types).map(type => AppFeedbackChatHelper.buildTypeFilter(type));
    return AppFeedbackChatHelper.buildAnyFilter(parts, Number.POSITIVE_INFINITY);
  }

  /** The status filter combined with sources and types of the options; `{}` matches everything. */
  static buildFilter(filter: FoodFeedbackChatFilter, options: AppFeedbackListOptions = {}): DirectusFilter {
    const parts = [AppFeedbackChatStatusHelper.buildFilter(filter), AppFeedbackChatHelper.buildSourcesFilter(options.sources), AppFeedbackChatHelper.buildTypesFilter(options.types)].filter((part): part is DirectusFilter => !!part);
    if (parts.length === 0) {
      return {};
    }
    return parts.length === 1 ? parts[0]! : { _and: parts };
  }

  /** The Directus `sort` of an order: newest first unless asked for the oldest. */
  static getSortParameter(sort?: FoodFeedbackListSort | null): string {
    return sort === FoodFeedbackListSort.OLDEST ? 'date_created' : '-date_created';
  }

  /** URL parameters of the list request. */
  static buildListQuery(filter: FoodFeedbackChatFilter, page: number, search?: string | null, options: AppFeedbackListOptions = {}) {
    const query: Record<string, string | number> = {
      fields: AppFeedbackChatHelper.LIST_FIELDS.join(','),
      filter: JSON.stringify(AppFeedbackChatHelper.buildFilter(filter, options)),
      sort: AppFeedbackChatHelper.getSortParameter(options.sort),
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

  /** URL parameters to count the feedbacks of one filter chip – with the same source, type and search as the list. */
  static buildCountQuery(filter: FoodFeedbackChatFilter, options: AppFeedbackListOptions = {}, search?: string | null) {
    const query: Record<string, string> = {
      aggregate: JSON.stringify({ count: ['id'] }),
      filter: JSON.stringify(AppFeedbackChatHelper.buildFilter(filter, options)),
    };
    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      query.search = trimmedSearch;
    }
    return query;
  }

  static getSourceFilterLabelKey(source: AppFeedbackSourceFilter): BackendTranslationKeys {
    switch (source) {
      case AppFeedbackSourceFilter.ALL:
        return BackendTranslationKeys.rocket_meals_module_source_all;
      case AppFeedbackSourceFilter.APP:
        return BackendTranslationKeys.rocket_meals_module_source_app;
      case AppFeedbackSourceFilter.APPLE:
        return BackendTranslationKeys.rocket_meals_module_source_apple;
      case AppFeedbackSourceFilter.GOOGLE_PLAY:
        return BackendTranslationKeys.rocket_meals_module_source_google_play;
    }
  }

  /** The icon of a source in the source filter – the brand icons of the stores. */
  static getSourceFilterIcon(source: AppFeedbackSourceFilter): string {
    switch (source) {
      case AppFeedbackSourceFilter.ALL:
        return 'apps';
      case AppFeedbackSourceFilter.APP:
        return 'smartphone';
      case AppFeedbackSourceFilter.APPLE:
        return 'apple';
      case AppFeedbackSourceFilter.GOOGLE_PLAY:
        return 'google_play';
    }
  }

  static getTypeFilterIcon(type: AppFeedbackTypeFilter): string {
    switch (type) {
      case AppFeedbackTypeFilter.ALL:
        return 'thumbs_up_down';
      case AppFeedbackTypeFilter.POSITIVE:
        return 'thumb_up';
      case AppFeedbackTypeFilter.NEGATIVE:
        return 'thumb_down';
    }
  }

  /** A Directus theme colour of the thumb, `undefined` for all. */
  static getTypeFilterColor(type: AppFeedbackTypeFilter): string | undefined {
    switch (type) {
      case AppFeedbackTypeFilter.POSITIVE:
        return 'var(--theme--success)';
      case AppFeedbackTypeFilter.NEGATIVE:
        return 'var(--theme--danger)';
      default:
        return undefined;
    }
  }

  static getTypeFilterLabelKey(type: AppFeedbackTypeFilter): BackendTranslationKeys {
    switch (type) {
      case AppFeedbackTypeFilter.ALL:
        return BackendTranslationKeys.rocket_meals_module_feedback_type_all;
      case AppFeedbackTypeFilter.POSITIVE:
        return BackendTranslationKeys.rocket_meals_module_feedback_positive;
      case AppFeedbackTypeFilter.NEGATIVE:
        return BackendTranslationKeys.rocket_meals_module_feedback_negative;
    }
  }

  /** The label of where a feedback comes from. */
  static getSourceLabelKey(feedback: Pick<AppFeedbackListItem, 'source_identifier'>): BackendTranslationKeys {
    switch (feedback.source_identifier) {
      case AppFeedbackSourceIdentifier.APPLE:
        return BackendTranslationKeys.rocket_meals_module_source_apple;
      case AppFeedbackSourceIdentifier.GOOGLE_PLAY:
        return BackendTranslationKeys.rocket_meals_module_source_google_play;
      default:
        return BackendTranslationKeys.rocket_meals_module_source_app;
    }
  }

  static getSourceIcon(feedback: Pick<AppFeedbackListItem, 'source_identifier'>): string {
    switch (feedback.source_identifier) {
      case AppFeedbackSourceIdentifier.APPLE:
        return AppFeedbackChatHelper.getSourceFilterIcon(AppFeedbackSourceFilter.APPLE);
      case AppFeedbackSourceIdentifier.GOOGLE_PLAY:
        return AppFeedbackChatHelper.getSourceFilterIcon(AppFeedbackSourceFilter.GOOGLE_PLAY);
      default:
        return AppFeedbackChatHelper.getSourceFilterIcon(AppFeedbackSourceFilter.APP);
    }
  }

  /** Thumbs up (`true`) or down (`false`), `undefined` when the user did not choose. */
  static isPositive(feedback: Pick<AppFeedbackListItem, 'positive'>): boolean | undefined {
    return feedback.positive === null || feedback.positive === undefined ? undefined : Boolean(feedback.positive);
  }

  /** Thumbs up / down, `undefined` when the user did not choose. */
  static getTypeIcon(feedback: Pick<AppFeedbackListItem, 'positive'>): string | undefined {
    const positive = AppFeedbackChatHelper.isPositive(feedback);
    if (positive === undefined) {
      return undefined;
    }
    return positive ? 'thumb_up' : 'thumb_down';
  }

  /** The trimmed title, `undefined` when there is none. */
  static getTitle(feedback: Pick<AppFeedbackListItem, 'title'>): string | undefined {
    const title = feedback.title?.trim();
    return title || undefined;
  }

  /** What the user wrote – without a legacy app state dump. */
  static getContent(feedback: Pick<AppFeedbackListItem, 'content'>): string {
    return AppFeedbackContentHelper.stripAppState(feedback.content).trim();
  }

  /** `iOS 18.1 · Apple`, from what the app sent along; `undefined` when nothing is known. */
  static getDeviceDescription(feedback: Pick<AppFeedbackListItem, 'device_platform' | 'device_system_version' | 'device_brand'>): string | undefined {
    const system = [feedback.device_platform, feedback.device_system_version].filter(part => !!part && String(part).trim().length > 0).join(' ');
    const description = [system, feedback.device_brand?.trim()].filter(part => !!part).join(' · ');
    return description || undefined;
  }

  /** The trimmed contact email, `undefined` when there is none or it is not a valid address. */
  static getContactEmail(feedback: Pick<AppFeedbackListItem, 'contact_email'>): string | undefined {
    const { trimmedEmail, isValid } = EmailHelper.sanitizeAndValidate(feedback.contact_email ?? '');
    return isValid ? trimmedEmail : undefined;
  }

  /** How support can answer the feedback, see {@link AppFeedbackAnswerChannel}. */
  static getAnswerChannel(feedback: Pick<AppFeedbackListItem, 'source_identifier' | 'profile' | 'chat' | 'contact_email'>): AppFeedbackAnswerChannel {
    if (AppFeedbackChatStatusHelper.isStoreReview(feedback)) {
      return AppFeedbackAnswerChannel.STORE;
    }
    if (AppFeedbackChatStatusHelper.canStartChat(feedback)) {
      return AppFeedbackAnswerChannel.CHAT;
    }
    return AppFeedbackChatHelper.getContactEmail(feedback) ? AppFeedbackAnswerChannel.MAIL : AppFeedbackAnswerChannel.NONE;
  }

  /**
   * Whether a feedback can be marked as done from the list: whenever it is not done yet – also
   * store reviews and feedbacks without profile, which nobody has to answer (e.g. positive ones).
   */
  static canMarkResolved(feedback: AppFeedbackListItem): boolean {
    return AppFeedbackChatStatusHelper.getStatus(feedback) !== FoodFeedbackChatStatus.RESOLVED;
  }
}
