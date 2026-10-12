/**
 * LivePulseHelper.ts – data side of the page "Live-Puls" (`live-pulse-page.vue`): who was active
 * lately, what is happening in the app right now and how busy today was.
 *
 * Sources, all read with the permissions of the person looking at the page:
 * - `profiles.date_updated` – last activity of a profile (the app touches it when it is opened).
 * - `foods_feedbacks`, `canteen_visits`, new `profiles` – the ticker.
 * - `app_usage_events` – anonymous usage events (e.g. food details loaded), never linked to a profile.
 * - `directus_activity` – distinct users per hour for the chart.
 *
 * No Vue in here, so the rules are testable in Node.
 */

import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { DefaultProfileHelper } from 'repo-depkit-common/src/DefaultProfileHelper';
import { AppUsageEventNames } from 'repo-depkit-common/src/AppUsageEventNames';
import { BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED } from '../BackendUsageEventNames';
import { FoodFeedbackChatHelper, type ModuleFoodFeedback } from './FoodFeedbackChatHelper';
import type { ModuleCanteenRelation, ModuleCreatedItem, ModuleImageItem, ModuleItem, ModuleProfileSummary } from './ModuleItemTypes';
import { RocketMealsModulePages } from './RocketMealsModulePages';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';
import type { DirectusRestQuery } from '../DirectusRestQuery';

type DirectusFilter = Record<string, unknown>;

/** Not (yet) part of `CollectionNames`: adding them there would make every hook wait for these tables. */
const CANTEEN_VISITS = 'canteen_visits';
const APP_USAGE_EVENTS = 'app_usage_events';

export enum LivePulsePresence {
  /** Active within the last `ACTIVE_NOW_MINUTES`. */
  NOW = 'now',
  /** Active within the last `ONLINE_MINUTES` – probably just put the phone away. */
  RECENT = 'recent',
  /** Active earlier today, offline now. */
  TODAY = 'today',
}

export enum LivePulseFeedType {
  RATING = 'rating',
  COMMENT = 'comment',
  CANTEEN_VISIT = 'canteen_visit',
  NEW_PROFILE = 'new_profile',
  /** Someone loaded the details of a food offer (`food-details-usage-event-hook`), anonymous. */
  FOOD_OPENED = 'food_opened',
  /** Someone opened one of the tracked screens (`*_screen_opened`), anonymous. */
  SCREEN_OPENED = 'screen_opened',
  /** Someone opened the details of a building (`building_details_opened`), anonymous. */
  BUILDING_OPENED = 'building_opened',
  /** Someone opened the details of a marking (`marking_details_opened`), anonymous. */
  MARKING_OPENED = 'marking_opened',
  USAGE_EVENT = 'usage_event',
}

export type LivePulseProfile = ModuleItem & ModuleProfileSummary;

type RelatedProfile = LivePulseProfile | string | null;

/** A food with what is needed for its picture in the ticker. */
export type LivePulseFood = ModuleImageItem;

export type LivePulseFoodFeedback = ModuleFoodFeedback & {
  foodoffer?: { id: string } | string | null;
  profile?: RelatedProfile;
};

export type LivePulseCanteenVisit = ModuleCreatedItem & {
  date?: string | null;
  canteen?: ModuleCanteenRelation;
  profile?: RelatedProfile;
};

export type LivePulseUsageEvent = ModuleCreatedItem & {
  event_type?: string | null;
  event_name?: string | null;
  screen_name?: string | null;
  platform?: string | null;
  session_id?: string | null;
  payload?: unknown;
};

export type LivePulseFeedItem = {
  /** Unique across all sources, stable between refreshes – used as list key and to spot new entries. */
  key: string;
  /** The record behind the entry – a changed rating gets a new `key` but keeps this, so it replaces its old entry. */
  sourceKey: string;
  type: LivePulseFeedType;
  date: string;
  profile?: LivePulseProfile;
  rating?: number | null;
  comment?: string | null;
  foodName?: string;
  /** The food, with image, if known – for its picture in the ticker. */
  food?: LivePulseFood;
  /** Id of the food, also when the food itself could not be loaded – the link target when the food offer is gone. */
  foodId?: string;
  /** Id of the food offer the entry is about – the preferred link target, see `getFoodRoute`. */
  foodofferId?: string;
  canteenName?: string;
  /** For a canteen visit: the day of the planned visit (`YYYY-MM-DD`). */
  visitDate?: string | null;
  eventName?: string | null;
  screenName?: string | null;
  platform?: string | null;
  /** For an opened building: its id (link target) and name, as the app sent them. */
  buildingId?: string;
  buildingName?: string;
  /** For an opened marking: its id (link target) and name, as the app sent them. */
  markingId?: string;
  markingName?: string;
};

/** One entry of the ticker filter (Directus `v-checkbox-tree` choices): a group with children, or a kind of entry. */
export type LivePulseFeedFilterChoice = {
  text: string;
  value: string;
  children?: LivePulseFeedFilterChoice[];
};

type LivePulseFeedFilterNode = {
  labelKey: BackendTranslationKeys;
  value: string;
  children?: LivePulseFeedFilterNode[];
};

export type LivePulseQuery = Pick<DirectusRestQuery, 'fields' | 'filter' | 'sort' | 'limit' | 'aggregate'>;

export class LivePulseHelper {
  /** How often the page reloads its data. */
  public static readonly REFRESH_INTERVAL_MS = 30_000;
  /** Hardly anyone looks at the app for longer: after 5 minutes without a request someone is no longer "active now". */
  public static readonly ACTIVE_NOW_MINUTES = 5;
  /** After 10 minutes without a request someone counts as offline. */
  public static readonly ONLINE_MINUTES = 10;
  /** Avatars shown on the wall. */
  public static readonly PROFILE_LIMIT = 30;
  /** Profiles loaded for the wall; the ones with own avatar and own nickname move to the front, see `sortProfilesForWall`. */
  public static readonly PROFILE_QUERY_LIMIT = 100;
  /** Entries loaded per ticker source; the merged ticker shows `FEED_LIMIT` of them. */
  public static readonly FEED_SOURCE_LIMIT = 15;
  public static readonly FEED_LIMIT = 25;
  public static readonly AVATAR_SIZE = 64;
  public static readonly FEED_AVATAR_SIZE = 36;
  /** New ticker entries are revealed one by one, spread over the refresh interval, but within these bounds. */
  public static readonly FEED_REVEAL_MIN_DELAY_MS = 700;
  public static readonly FEED_REVEAL_MAX_DELAY_MS = 4_000;

  /**
   * Collections in which app users leave traces in `directus_activity`. Restricting the chart to
   * these keeps staff editing foods or news in Directus out of it.
   */
  public static readonly APP_ACTIVITY_COLLECTIONS: readonly string[] = ['directus_users', CollectionNames.PROFILES, CollectionNames.FOODS_FEEDBACKS, CANTEEN_VISITS, CollectionNames.DEVICES, CollectionNames.CHAT_MESSAGES, CollectionNames.FRIENDSHIPS, CollectionNames.COLLECTIBLE_EVENT_PARTICIPANTS, CollectionNames.APP_FEEDBACKS, CollectionNames.FORM_SUBMISSIONS];

  static readonly PROFILES_ENDPOINT = `/items/${CollectionNames.PROFILES}`;
  static readonly FOOD_FEEDBACKS_ENDPOINT = `/items/${CollectionNames.FOODS_FEEDBACKS}`;
  static readonly FOODS_ENDPOINT = `/items/${CollectionNames.FOODS}`;
  static readonly FOODOFFERS_ENDPOINT = `/items/${CollectionNames.FOODOFFERS}`;
  static readonly CANTEEN_VISITS_ENDPOINT = `/items/${CANTEEN_VISITS}`;
  static readonly APP_USAGE_EVENTS_ENDPOINT = `/items/${APP_USAGE_EVENTS}`;
  static readonly ACTIVITY_ENDPOINT = '/activity';
  /** Path of `profile-avatar-endpoint`, relative to the API root. */
  static readonly AVATAR_ENDPOINT = 'profile-avatar';

  /** The label of each tracked screen in the ticker. */
  private static readonly SCREEN_LABEL_KEYS: Readonly<Record<string, BackendTranslationKeys>> = {
    [AppUsageEventNames.MAP_SCREEN_OPENED]: BackendTranslationKeys.rocket_meals_module_live_pulse_screen_map,
    [AppUsageEventNames.COURSE_TIMETABLE_SCREEN_OPENED]: BackendTranslationKeys.rocket_meals_module_live_pulse_screen_course_timetable,
    [AppUsageEventNames.NEWS_SCREEN_OPENED]: BackendTranslationKeys.rocket_meals_module_live_pulse_screen_news,
    [AppUsageEventNames.HOUSING_SCREEN_OPENED]: BackendTranslationKeys.rocket_meals_module_live_pulse_screen_housing,
    [AppUsageEventNames.ACCOUNT_BALANCE_SCREEN_OPENED]: BackendTranslationKeys.rocket_meals_module_live_pulse_screen_account_balance,
    [AppUsageEventNames.FOODOFFERS_SCREEN_OPENED]: BackendTranslationKeys.rocket_meals_module_live_pulse_screen_foodoffers,
    [AppUsageEventNames.CAMPUS_SCREEN_OPENED]: BackendTranslationKeys.rocket_meals_module_live_pulse_screen_campus,
    [AppUsageEventNames.SETTINGS_SCREEN_OPENED]: BackendTranslationKeys.rocket_meals_module_live_pulse_screen_settings,
    [AppUsageEventNames.DATA_ACCESS_SCREEN_OPENED]: BackendTranslationKeys.rocket_meals_module_live_pulse_screen_data_access,
    [AppUsageEventNames.EATING_HABITS_SCREEN_OPENED]: BackendTranslationKeys.rocket_meals_module_live_pulse_screen_eating_habits,
  };

  /** Usage events the ticker filter can switch off one by one, by the kind of entry they become. */
  private static readonly USAGE_EVENT_FILTER_KEYS: Readonly<Record<string, string>> = {
    [LivePulseFeedType.FOOD_OPENED]: BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED,
    [LivePulseFeedType.BUILDING_OPENED]: AppUsageEventNames.BUILDING_DETAILS_OPENED,
    [LivePulseFeedType.MARKING_OPENED]: AppUsageEventNames.MARKING_DETAILS_OPENED,
  };

  /**
   * The ticker filter: "Alle" on top, below it every kind of entry. Screens are filtered one by one
   * (their event name is the key), every other entry by its `LivePulseFeedType`. Groups only tick
   * or untick their children, they are never stored.
   */
  private static readonly FEED_FILTER_TREE: LivePulseFeedFilterNode[] = [
    {
      labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_all,
      value: 'group_all',
      children: [
        {
          labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_feedback,
          value: 'group_feedback',
          children: [
            { labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_ratings, value: LivePulseFeedType.RATING },
            { labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_comments, value: LivePulseFeedType.COMMENT },
          ],
        },
        { labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_canteen_visits, value: LivePulseFeedType.CANTEEN_VISIT },
        { labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_new_profiles, value: LivePulseFeedType.NEW_PROFILE },
        {
          labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_app_usage,
          value: 'group_app_usage',
          children: [
            { labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_foods_opened, value: LivePulseFeedType.FOOD_OPENED },
            { labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_buildings_opened, value: LivePulseFeedType.BUILDING_OPENED },
            { labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_markings_opened, value: LivePulseFeedType.MARKING_OPENED },
            {
              labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_screens,
              value: 'group_screens',
              children: Object.entries(LivePulseHelper.SCREEN_LABEL_KEYS).map(([eventName, labelKey]) => ({ labelKey, value: eventName })),
            },
            { labelKey: BackendTranslationKeys.rocket_meals_module_live_pulse_feed_filter_other_events, value: LivePulseFeedType.USAGE_EVENT },
          ],
        },
      ],
    },
  ];

  private static readonly PROFILE_FIELDS = ['id', 'nickname', 'avatar', 'date_updated', 'date_created'];

  private static relatedProfileFields(): string[] {
    return LivePulseHelper.PROFILE_FIELDS.map(field => `profile.${field}`);
  }

  /** Midnight of `now` in the browser's time zone. */
  static getStartOfDay(now: Date): Date {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  static minutesBefore(now: Date, minutes: number): Date {
    return new Date(now.getTime() - minutes * 60_000);
  }

  static getPresence(dateUpdated: string | null | undefined, now: Date): LivePulsePresence {
    const time = dateUpdated ? new Date(dateUpdated).getTime() : Number.NaN;
    if (Number.isNaN(time)) {
      return LivePulsePresence.TODAY;
    }
    const minutesAgo = (now.getTime() - time) / 60_000;
    if (minutesAgo <= LivePulseHelper.ACTIVE_NOW_MINUTES) {
      return LivePulsePresence.NOW;
    }
    if (minutesAgo <= LivePulseHelper.ONLINE_MINUTES) {
      return LivePulsePresence.RECENT;
    }
    return LivePulsePresence.TODAY;
  }

  static getPresenceLabelKey(presence: LivePulsePresence): BackendTranslationKeys {
    switch (presence) {
      case LivePulsePresence.NOW:
        return BackendTranslationKeys.rocket_meals_module_live_pulse_presence_now;
      case LivePulsePresence.RECENT:
        return BackendTranslationKeys.rocket_meals_module_live_pulse_presence_recent;
      default:
        return BackendTranslationKeys.rocket_meals_module_live_pulse_presence_today;
    }
  }

  /**
   * Profiles active right now or a few minutes ago (within `ONLINE_MINUTES`), most recent first –
   * `sortProfilesForWall` picks the ones shown. Who was only active earlier today stays off the wall.
   */
  static buildActiveProfilesQuery(now: Date): LivePulseQuery {
    return {
      fields: LivePulseHelper.PROFILE_FIELDS.join(','),
      filter: JSON.stringify(LivePulseHelper.buildProfilesActiveSinceFilter(LivePulseHelper.minutesBefore(now, LivePulseHelper.ONLINE_MINUTES))),
      sort: '-date_updated',
      limit: LivePulseHelper.PROFILE_QUERY_LIMIT,
    };
  }

  /**
   * Whether the profile has a nickname of its own – not empty and not the default every profile starts with
   * (`Curie`, formerly `Guest_…`, see `DefaultProfileHelper`).
   */
  static hasOwnNickname(profile: LivePulseProfile | undefined): boolean {
    const nickname = profile?.nickname?.trim();
    return !!nickname && !DefaultProfileHelper.isDefaultNickname(nickname);
  }

  /** Whether the profile has an avatar the user made – not the scientist avatar every profile starts with. */
  static hasOwnAvatar(profile: LivePulseProfile | undefined): boolean {
    return LivePulseHelper.hasAvatar(profile) && !DefaultProfileHelper.isDefaultAvatar(profile?.avatar);
  }

  /**
   * Whether the profile is shown as a silhouette (in the project color) instead of its avatar or
   * initials: it has neither an avatar nor a nickname of its own, so there is nothing personal to show.
   */
  static showsSilhouette(profile: LivePulseProfile | undefined): boolean {
    return !!profile && !LivePulseHelper.hasOwnAvatar(profile) && !LivePulseHelper.hasOwnNickname(profile);
  }

  /**
   * Order of the wall: profiles active right now before the ones that were active a few minutes ago (see `getPresence`).
   * Within each of these, profiles with an own avatar first, among them the ones with an own nickname first,
   * then the ones with only an own nickname, then the rest – each group most recently active first.
   * Keeps at most `PROFILE_LIMIT`.
   */
  static sortProfilesForWall(profiles: LivePulseProfile[], now: Date): LivePulseProfile[] {
    const presenceOrder: LivePulsePresence[] = [LivePulsePresence.NOW, LivePulsePresence.RECENT, LivePulsePresence.TODAY];
    const presence = (profile: LivePulseProfile) => presenceOrder.indexOf(LivePulseHelper.getPresence(profile.date_updated, now));
    const rank = (profile: LivePulseProfile) => (LivePulseHelper.hasOwnAvatar(profile) ? 2 : 0) + (LivePulseHelper.hasOwnNickname(profile) ? 1 : 0);
    const time = (profile: LivePulseProfile) => {
      const value = profile.date_updated ? new Date(profile.date_updated).getTime() : Number.NaN;
      return Number.isNaN(value) ? 0 : value;
    };
    return [...profiles].sort((a, b) => presence(a) - presence(b) || rank(b) - rank(a) || time(b) - time(a)).slice(0, LivePulseHelper.PROFILE_LIMIT);
  }

  static buildCountQuery(filter: DirectusFilter, field: string = 'id'): LivePulseQuery {
    return {
      aggregate: JSON.stringify({ count: field }),
      filter: JSON.stringify(filter),
    };
  }

  static buildCountDistinctQuery(filter: DirectusFilter, field: string): LivePulseQuery {
    return {
      aggregate: JSON.stringify({ countDistinct: field }),
      filter: JSON.stringify(filter),
    };
  }

  /** Profiles whose `date_updated` lies after `since`. */
  static buildProfilesActiveSinceFilter(since: Date): DirectusFilter {
    return { date_updated: { _gte: since.toISOString() } };
  }

  static buildCreatedSinceFilter(since: Date): DirectusFilter {
    return { date_created: { _gte: since.toISOString() } };
  }

  /** Food feedbacks of today with a rating or a comment. */
  static buildFoodFeedbacksQuery(now: Date): LivePulseQuery {
    return {
      fields: ['id', 'rating', 'comment', 'date_created', 'date_updated', 'foodoffer', 'food.id', 'food.alias', 'food.image', 'food.image_remote_url', 'canteen.id', 'canteen.alias', ...LivePulseHelper.relatedProfileFields()].join(','),
      filter: JSON.stringify({
        _and: [{ date_updated: { _gte: LivePulseHelper.getStartOfDay(now).toISOString() } }, { _or: [{ rating: { _nnull: true } }, { comment: { _nnull: true } }] }],
      }),
      sort: '-date_updated',
      limit: LivePulseHelper.FEED_SOURCE_LIMIT,
    };
  }

  static buildCanteenVisitsQuery(now: Date): LivePulseQuery {
    return {
      fields: ['id', 'date', 'date_created', 'canteen.id', 'canteen.alias', ...LivePulseHelper.relatedProfileFields()].join(','),
      filter: JSON.stringify(LivePulseHelper.buildCreatedSinceFilter(LivePulseHelper.getStartOfDay(now))),
      sort: '-date_created',
      limit: LivePulseHelper.FEED_SOURCE_LIMIT,
    };
  }

  static buildNewProfilesQuery(now: Date): LivePulseQuery {
    return {
      fields: LivePulseHelper.PROFILE_FIELDS.join(','),
      filter: JSON.stringify(LivePulseHelper.buildCreatedSinceFilter(LivePulseHelper.getStartOfDay(now))),
      sort: '-date_created',
      limit: LivePulseHelper.FEED_SOURCE_LIMIT,
    };
  }

  /**
   * Usage events of today. Kinds the ticker filter hides are left out already in the query, so the
   * `FEED_SOURCE_LIMIT` entries are all ones that are shown.
   */
  static buildUsageEventsQuery(now: Date, hiddenFilterKeys: ReadonlySet<string> = new Set()): LivePulseQuery {
    const conditions: DirectusFilter[] = [LivePulseHelper.buildCreatedSinceFilter(LivePulseHelper.getStartOfDay(now))];
    const eventNameFilter = LivePulseHelper.buildUsageEventNameFilter(hiddenFilterKeys);
    if (eventNameFilter) {
      conditions.push({ event_name: eventNameFilter });
    }
    return {
      fields: ['id', 'event_type', 'event_name', 'screen_name', 'platform', 'payload', 'date_created'].join(','),
      filter: JSON.stringify(conditions.length === 1 ? conditions[0] : { _and: conditions }),
      sort: '-date_created',
      limit: LivePulseHelper.FEED_SOURCE_LIMIT,
    };
  }

  /**
   * The event names the ticker filter lets through: with "other events" shown everything except the
   * hidden known events (`_nin`), else only the shown known events (`_in`). `undefined` when nothing is hidden.
   */
  private static buildUsageEventNameFilter(hiddenFilterKeys: ReadonlySet<string>): DirectusFilter | undefined {
    const known = LivePulseHelper.getKnownUsageEventNames();
    const hidden = known.filter(({ filterKey }) => hiddenFilterKeys.has(filterKey)).map(({ eventName }) => eventName);
    if (!hiddenFilterKeys.has(LivePulseFeedType.USAGE_EVENT)) {
      return hidden.length > 0 ? { _nin: hidden } : undefined;
    }
    return { _in: known.filter(({ filterKey }) => !hiddenFilterKeys.has(filterKey)).map(({ eventName }) => eventName) };
  }

  /** Every usage event the ticker knows by name, with the filter key it is shown under. */
  private static getKnownUsageEventNames(): { eventName: string; filterKey: string }[] {
    return [...Object.entries(LivePulseHelper.USAGE_EVENT_FILTER_KEYS).map(([filterKey, eventName]) => ({ eventName, filterKey })), ...Object.keys(LivePulseHelper.SCREEN_LABEL_KEYS).map(eventName => ({ eventName, filterKey: eventName }))];
  }

  /** The ticker filter as choices for `v-checkbox-tree`, translated. */
  static getFeedFilterChoices(translate: (key: BackendTranslationKeys) => string): LivePulseFeedFilterChoice[] {
    const toChoice = (node: LivePulseFeedFilterNode): LivePulseFeedFilterChoice => ({ text: translate(node.labelKey), value: node.value, ...(node.children ? { children: node.children.map(toChoice) } : {}) });
    return LivePulseHelper.FEED_FILTER_TREE.map(toChoice);
  }

  /** Every kind of entry the filter knows (the leaves of the tree). */
  static getFeedFilterKeys(): string[] {
    const leaves = (nodes: LivePulseFeedFilterNode[]): string[] => nodes.flatMap(node => (node.children ? leaves(node.children) : [node.value]));
    return leaves(LivePulseHelper.FEED_FILTER_TREE);
  }

  /** The filter key of an entry: the event name for an opened screen, else its type. */
  static getFeedFilterKey(item: LivePulseFeedItem): string {
    return item.type === LivePulseFeedType.SCREEN_OPENED && item.eventName ? item.eventName : item.type;
  }

  static isFeedItemShown(item: LivePulseFeedItem, hiddenFilterKeys: ReadonlySet<string>): boolean {
    return !hiddenFilterKeys.has(LivePulseHelper.getFeedFilterKey(item));
  }

  /** Whether any of `filterKeys` is shown – a source whose kinds are all hidden is not loaded at all. */
  static isAnyFeedFilterKeyShown(filterKeys: readonly string[], hiddenFilterKeys: ReadonlySet<string>): boolean {
    return filterKeys.some(key => !hiddenFilterKeys.has(key));
  }

  /** The filter keys of the usage events: everything below "App-Nutzung". */
  static getUsageEventFeedFilterKeys(): string[] {
    return [...LivePulseHelper.getKnownUsageEventNames().map(({ filterKey }) => filterKey), LivePulseFeedType.USAGE_EVENT];
  }

  /**
   * The ticked kinds for the tree, from the stored hidden ones. The hidden ones are stored (not the
   * shown ones), so a kind added later is shown right away.
   */
  static getShownFeedFilterKeys(hiddenFilterKeys: ReadonlySet<string>): string[] {
    return LivePulseHelper.getFeedFilterKeys().filter(key => !hiddenFilterKeys.has(key));
  }

  /** The hidden kinds from what the tree has ticked. Group values in the selection are ignored. */
  static getHiddenFeedFilterKeys(shownFilterKeys: readonly unknown[] | null | undefined): string[] {
    const shown = new Set(shownFilterKeys ?? []);
    return LivePulseHelper.getFeedFilterKeys().filter(key => !shown.has(key));
  }

  /** Stored hidden kinds, reduced to the ones that still exist. Anything unreadable hides nothing. */
  static readHiddenFeedFilterKeys(value: unknown): Set<string> {
    if (!Array.isArray(value)) {
      return new Set();
    }
    const known = new Set(LivePulseHelper.getFeedFilterKeys());
    return new Set(value.filter((key): key is string => typeof key === 'string' && known.has(key)));
  }

  /** The food ids that the usage events carry in their payload (`food_details_opened`). */
  static getUsageEventFoodIds(events: LivePulseUsageEvent[]): string[] {
    const ids = new Set<string>();
    for (const event of events) {
      const foodId = LivePulseHelper.getPayload(event).food_id;
      if ((typeof foodId === 'string' && foodId) || typeof foodId === 'number') {
        ids.add(String(foodId));
      }
    }
    return [...ids];
  }

  /** The foods of the ticker, with their image. `undefined` when there is nothing to load. */
  static buildFoodsQuery(foodIds: string[]): LivePulseQuery | undefined {
    if (foodIds.length === 0) {
      return undefined;
    }
    return {
      fields: ['id', 'alias', 'image', 'image_remote_url'].join(','),
      filter: JSON.stringify({ id: { _in: foodIds } }),
      limit: foodIds.length,
    };
  }

  /** The food offers the ticker links to – their ids are kept, the offers themselves may be gone by now. */
  static getFeedFoodofferIds(items: LivePulseFeedItem[]): string[] {
    return [...new Set(items.map(item => item.foodofferId).filter((id): id is string => !!id))];
  }

  /**
   * Which of the food offers still exist: the parser replaces them, an entry from the morning may
   * point to an offer that is deleted. `undefined` when there is nothing to check.
   */
  static buildExistingFoodoffersQuery(foodofferIds: string[]): LivePulseQuery | undefined {
    if (foodofferIds.length === 0) {
      return undefined;
    }
    return {
      fields: 'id',
      filter: JSON.stringify({ id: { _in: foodofferIds } }),
      limit: foodofferIds.length,
    };
  }

  /** The profile page of the module, `undefined` without a profile. */
  static getProfileRoute(profile: LivePulseProfile | undefined): string | undefined {
    return profile?.id ? RocketMealsModulePages.getProfileRoute(profile.id) : undefined;
  }

  /**
   * Where a click on the food of an entry leads: the food offer while it still exists, else the food.
   * `undefined` when the entry knows neither.
   */
  static getFoodRoute(item: LivePulseFeedItem, existingFoodofferIds: ReadonlySet<string>): string | undefined {
    if (item.foodofferId && existingFoodofferIds.has(item.foodofferId)) {
      return `/content/${CollectionNames.FOODOFFERS}/${encodeURIComponent(item.foodofferId)}`;
    }
    if (item.foodId) {
      return `/content/${CollectionNames.FOODS}/${encodeURIComponent(item.foodId)}`;
    }
    return undefined;
  }

  /** The building of an entry in the content module, `undefined` without a building id. */
  static getBuildingRoute(item: LivePulseFeedItem): string | undefined {
    return item.buildingId ? `/content/${CollectionNames.BUILDINGS}/${encodeURIComponent(item.buildingId)}` : undefined;
  }

  /** The marking of an entry in the content module, `undefined` without a marking id. */
  static getMarkingRoute(item: LivePulseFeedItem): string | undefined {
    return item.markingId ? `/content/${CollectionNames.MARKINGS}/${encodeURIComponent(item.markingId)}` : undefined;
  }

  /**
   * Where the linked part of an entry leads: the building or marking it is about, else its food
   * (see `getFoodRoute`). `undefined` when there is nothing to link.
   */
  static getLinkRoute(item: LivePulseFeedItem, existingFoodofferIds: ReadonlySet<string>): string | undefined {
    switch (item.type) {
      case LivePulseFeedType.BUILDING_OPENED:
        return LivePulseHelper.getBuildingRoute(item);
      case LivePulseFeedType.MARKING_OPENED:
        return LivePulseHelper.getMarkingRoute(item);
      case LivePulseFeedType.SCREEN_OPENED:
      case LivePulseFeedType.USAGE_EVENT:
        return undefined;
      default:
        return LivePulseHelper.getFoodRoute(item, existingFoodofferIds);
    }
  }

  /** Label of a tracked screen, `undefined` for any other event. */
  static getScreenLabelKey(eventName: string | null | undefined): BackendTranslationKeys | undefined {
    return eventName ? LivePulseHelper.SCREEN_LABEL_KEYS[eventName] : undefined;
  }

  /**
   * Splits a translated text at the spot where `marker` was interpolated, so the part in between
   * can be rendered as a link. Without the marker, everything is `before`.
   */
  static splitAtMarker(text: string, marker: string): { before: string; after: string; found: boolean } {
    const index = text.indexOf(marker);
    if (index < 0) {
      return { before: text, after: '', found: false };
    }
    return { before: text.slice(0, index), after: text.slice(index + marker.length), found: true };
  }

  /** Thumbnail of the food (Directus file, else remote URL), `undefined` without a picture. */
  static getFoodImageUrl(food: LivePulseFood | undefined, apiRoot: string = '/'): string | undefined {
    return food ? FoodFeedbackChatHelper.getFoodImageUrl({ food }, apiRoot) : undefined;
  }

  private static getPayload(event: LivePulseUsageEvent): Record<string, unknown> {
    return event.payload && typeof event.payload === 'object' ? (event.payload as Record<string, unknown>) : {};
  }

  /** Food offer details loaded today (`food-details-usage-event-hook`). */
  static buildFoodViewsTodayQuery(now: Date): LivePulseQuery {
    return LivePulseHelper.buildCountQuery({ _and: [LivePulseHelper.buildCreatedSinceFilter(LivePulseHelper.getStartOfDay(now)), { event_name: { _eq: BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED } }] });
  }

  /**
   * Start and end of each hour from midnight up to the current hour. The chart asks per hour with
   * plain timestamps instead of Directus' `hour()` function: that one counts in the time zone of the
   * database, the chart has to count in the time zone of the person looking at it.
   */
  static getHourBuckets(now: Date): { start: Date; end: Date }[] {
    const startOfDay = LivePulseHelper.getStartOfDay(now);
    const buckets: { start: Date; end: Date }[] = [];
    for (let hour = 0; hour <= now.getHours(); hour++) {
      const start = new Date(startOfDay);
      start.setHours(hour);
      const end = new Date(startOfDay);
      end.setHours(hour + 1);
      buckets.push({ start, end });
    }
    return buckets;
  }

  /** Distinct app users with an entry in `directus_activity` within one hour. */
  static buildActivityHourQuery(start: Date, end: Date): LivePulseQuery {
    return LivePulseHelper.buildCountDistinctQuery(
      {
        _and: [{ timestamp: { _gte: start.toISOString() } }, { timestamp: { _lt: end.toISOString() } }, { user: { _nnull: true } }, { collection: { _in: [...LivePulseHelper.APP_ACTIVITY_COLLECTIONS] } }],
      },
      'user'
    );
  }

  /** Reads the number out of a Directus aggregate response, e.g. `[{ countDistinct: { user: '4' } }]`. */
  static readAggregate(data: unknown, aggregate: 'count' | 'countDistinct', field: string): number {
    const row = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
    const value = (row?.[aggregate] as Record<string, unknown> | undefined)?.[field];
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  }

  static getProfile(profile: RelatedProfile | undefined): LivePulseProfile | undefined {
    return profile && typeof profile === 'object' ? profile : undefined;
  }

  private static getRelatedId(relation: { id: string | number } | string | number | null | undefined): string | undefined {
    if (relation === null || relation === undefined || relation === '') {
      return undefined;
    }
    if (typeof relation !== 'object') {
      return String(relation);
    }
    return relation.id !== null && relation.id !== undefined ? String(relation.id) : undefined;
  }

  private static getAlias(relation: { alias?: string | null } | string | null | undefined): string | undefined {
    return relation && typeof relation === 'object' ? relation.alias || undefined : undefined;
  }

  /** Merges all ticker sources into one list, newest first, without the kinds the filter hides. */
  static buildFeed(sources: { foodFeedbacks?: LivePulseFoodFeedback[]; canteenVisits?: LivePulseCanteenVisit[]; newProfiles?: LivePulseProfile[]; usageEvents?: LivePulseUsageEvent[]; foods?: LivePulseFood[] }, hiddenFilterKeys: ReadonlySet<string> = new Set()): LivePulseFeedItem[] {
    const foodsById = new Map((sources.foods ?? []).map(food => [String(food.id), food]));
    const candidates: (LivePulseFeedItem | undefined)[] = [...(sources.foodFeedbacks ?? []).map(feedback => LivePulseHelper.buildFoodFeedbackFeedItem(feedback)), ...(sources.canteenVisits ?? []).map(visit => LivePulseHelper.buildCanteenVisitFeedItem(visit)), ...(sources.newProfiles ?? []).map(profile => LivePulseHelper.buildNewProfileFeedItem(profile)), ...(sources.usageEvents ?? []).map(event => LivePulseHelper.buildUsageEventFeedItem(event, foodsById))];
    const items = candidates.filter((item): item is LivePulseFeedItem => item !== undefined && LivePulseHelper.isFeedItemShown(item, hiddenFilterKeys));

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items.slice(0, LivePulseHelper.FEED_LIMIT);
  }

  /** A rating or comment – a changed rating gets a new entry (key with the date), replacing the old one. */
  private static buildFoodFeedbackFeedItem(feedback: LivePulseFoodFeedback): LivePulseFeedItem | undefined {
    const date = feedback.date_updated || feedback.date_created;
    if (!date) return undefined;
    return {
      key: `feedback-${feedback.id}-${date}`,
      sourceKey: `feedback-${feedback.id}`,
      type: feedback.comment ? LivePulseFeedType.COMMENT : LivePulseFeedType.RATING,
      date,
      profile: LivePulseHelper.getProfile(feedback.profile),
      rating: feedback.rating,
      comment: feedback.comment,
      foodName: LivePulseHelper.getAlias(feedback.food),
      food: feedback.food && typeof feedback.food === 'object' ? feedback.food : undefined,
      foodId: LivePulseHelper.getRelatedId(feedback.food),
      foodofferId: LivePulseHelper.getRelatedId(feedback.foodoffer),
      canteenName: LivePulseHelper.getAlias(feedback.canteen),
    };
  }

  private static buildCanteenVisitFeedItem(visit: LivePulseCanteenVisit): LivePulseFeedItem | undefined {
    if (!visit.date_created) return undefined;
    return {
      key: `visit-${visit.id}`,
      sourceKey: `visit-${visit.id}`,
      type: LivePulseFeedType.CANTEEN_VISIT,
      date: visit.date_created,
      profile: LivePulseHelper.getProfile(visit.profile),
      canteenName: LivePulseHelper.getAlias(visit.canteen),
      visitDate: visit.date ? visit.date.slice(0, 10) : null,
    };
  }

  private static buildNewProfileFeedItem(profile: LivePulseProfile): LivePulseFeedItem | undefined {
    if (!profile.date_created) return undefined;
    return { key: `profile-${profile.id}`, sourceKey: `profile-${profile.id}`, type: LivePulseFeedType.NEW_PROFILE, date: profile.date_created, profile };
  }

  private static buildUsageEventFeedItem(event: LivePulseUsageEvent, foodsById: Map<string, LivePulseFood>): LivePulseFeedItem | undefined {
    if (!event.date_created) return undefined;
    const payload = LivePulseHelper.getPayload(event);
    const payloadFoodId = LivePulseHelper.getRelatedId(payload.food_id as string | number | null | undefined);
    const food = payloadFoodId === undefined ? undefined : foodsById.get(payloadFoodId);
    return {
      key: `event-${event.id}`,
      sourceKey: `event-${event.id}`,
      type: LivePulseHelper.getUsageEventFeedType(event.event_name),
      date: event.date_created,
      eventName: event.event_name,
      screenName: event.screen_name,
      platform: event.platform,
      foodName: typeof payload.food_name === 'string' && payload.food_name ? payload.food_name : (food?.alias ?? undefined),
      food,
      foodId: payloadFoodId ?? food?.id,
      foodofferId: LivePulseHelper.getRelatedId(payload.foodoffer_id as string | number | null | undefined),
      buildingId: LivePulseHelper.getRelatedId(payload.building_id as string | number | null | undefined),
      buildingName: LivePulseHelper.getPayloadText(payload.building_name),
      markingId: LivePulseHelper.getRelatedId(payload.marking_id as string | number | null | undefined),
      markingName: LivePulseHelper.getPayloadText(payload.marking_name),
    };
  }

  private static getUsageEventFeedType(eventName: string | null | undefined): LivePulseFeedType {
    if (eventName === BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED) {
      return LivePulseFeedType.FOOD_OPENED;
    }
    if (eventName === AppUsageEventNames.BUILDING_DETAILS_OPENED) {
      return LivePulseFeedType.BUILDING_OPENED;
    }
    if (eventName === AppUsageEventNames.MARKING_DETAILS_OPENED) {
      return LivePulseFeedType.MARKING_OPENED;
    }
    if (LivePulseHelper.getScreenLabelKey(eventName)) {
      return LivePulseFeedType.SCREEN_OPENED;
    }
    return LivePulseFeedType.USAGE_EVENT;
  }

  private static getPayloadText(value: unknown): string | undefined {
    return typeof value === 'string' && value ? value : undefined;
  }

  /**
   * Entries of `next` the ticker does not show or queue yet, oldest first – the order in which they
   * are revealed, so the newest ends up on top.
   */
  static findNewFeedItems(next: LivePulseFeedItem[], knownKeys: Set<string>): LivePulseFeedItem[] {
    return next.filter(item => !knownKeys.has(item.key)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Pause before the next queued entry slides in: the queue is spread over one refresh interval, so
   * the ticker keeps moving until the next data arrives – never slower or faster than the bounds.
   */
  static getRevealDelayMs(pendingCount: number): number {
    if (pendingCount <= 0) {
      return LivePulseHelper.FEED_REVEAL_MAX_DELAY_MS;
    }
    const spread = LivePulseHelper.REFRESH_INTERVAL_MS / pendingCount;
    return Math.round(Math.min(LivePulseHelper.FEED_REVEAL_MAX_DELAY_MS, Math.max(LivePulseHelper.FEED_REVEAL_MIN_DELAY_MS, spread)));
  }

  /** Whether `profiles.avatar` holds an avatar config (object or JSON string with a `style`). */
  static hasAvatar(profile: LivePulseProfile | undefined): boolean {
    let avatar = profile?.avatar;
    if (typeof avatar === 'string') {
      try {
        avatar = JSON.parse(avatar);
      } catch {
        return false;
      }
    }
    return !!avatar && typeof avatar === 'object' && typeof (avatar as { style?: unknown }).style === 'string';
  }

  /**
   * URL of the avatar drawn by `profile-avatar-endpoint`. `v` changes with the avatar, so the
   * browser cache never shows an old one. `undefined` when the profile has no avatar.
   */
  static getAvatarUrl(profile: LivePulseProfile | undefined, size: number, apiRoot: string = '/'): string | undefined {
    if (!profile || !LivePulseHelper.hasAvatar(profile)) {
      return undefined;
    }
    const root = apiRoot.endsWith('/') ? apiRoot : `${apiRoot}/`;
    const version = LivePulseHelper.hashString(typeof profile.avatar === 'string' ? profile.avatar : JSON.stringify(profile.avatar));
    return `${root}${LivePulseHelper.AVATAR_ENDPOINT}/${encodeURIComponent(profile.id)}?size=${size}&v=${version}`;
  }

  /** Screens, buildings and markings the mock events of `buildMockUsageEvents` pick from. */
  private static readonly MOCK_BUILDINGS = ['Mensa am Campus', 'Bibliothek', 'Hörsaalgebäude 2', 'Wohnheim Nord'];
  private static readonly MOCK_MARKINGS = ['Vegan', 'Vegetarisch', 'Glutenfrei', 'Laktosefrei'];

  /**
   * Made-up usage events for trying the ticker without real traffic (switch `MOCK_USAGE_EVENTS` on the
   * page). Never written anywhere. `seed` makes ids unique across calls.
   */
  static buildMockUsageEvents(now: Date, count: number, seed: number): LivePulseUsageEvent[] {
    const screens = Object.keys(LivePulseHelper.SCREEN_LABEL_KEYS);
    const pick = <T>(values: readonly T[], index: number): T => values[index % values.length]!;
    return Array.from({ length: count }, (_, index) => {
      const number = seed * count + index;
      const id = `mock-${seed}-${index}`;
      const date_created = new Date(now.getTime() - (count - index) * 1000).toISOString();
      const platform = pick(['ios', 'android', 'web'], number);
      switch (number % 3) {
        case 0:
          return { id, date_created, platform, event_name: AppUsageEventNames.BUILDING_DETAILS_OPENED, payload: { building_id: `mock-building-${number % 4}`, building_name: pick(LivePulseHelper.MOCK_BUILDINGS, number) } };
        case 1:
          return { id, date_created, platform, event_name: AppUsageEventNames.MARKING_DETAILS_OPENED, payload: { marking_id: `mock-marking-${number % 4}`, marking_name: pick(LivePulseHelper.MOCK_MARKINGS, number) } };
        default:
          return { id, date_created, platform, event_name: pick(screens, number), screen_name: 'mock' };
      }
    });
  }

  /**
   * URL of the silhouette drawn by `profile-avatar-endpoint` for profiles without own avatar and
   * nickname (see `showsSilhouette`), in `color` (the project color, hex with or without `#`).
   */
  static getSilhouetteAvatarUrl(size: number, color: string | null | undefined, apiRoot: string = '/'): string {
    const root = apiRoot.endsWith('/') ? apiRoot : `${apiRoot}/`;
    const hex = (color ?? '').trim();
    const colorParam = hex ? `&color=${encodeURIComponent(hex.startsWith('#') ? hex.slice(1) : hex)}` : '';
    return `${root}${LivePulseHelper.AVATAR_ENDPOINT}/silhouette?size=${size}${colorParam}`;
  }

  /** Short, stable hash (djb2) – only used to version URLs. */
  static hashString(value: string): string {
    let hash = 5381;
    for (let index = 0; index < value.length; index++) {
      hash = ((hash << 5) + hash + value.codePointAt(index)!) >>> 0;
    }
    return (hash >>> 0).toString(36);
  }

  /** Two letters for the avatar fallback of a profile without avatar. */
  static getInitials(nickname: string | null | undefined): string {
    const words = (nickname ?? '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return '?';
    }
    const first = words[0]!;
    const second = words[1];
    return (second ? first.charAt(0) + second.charAt(0) : first.slice(0, 2)).toUpperCase();
  }

  /** „vor 5 Minuten“ in the language of the Directus UI, via `Intl.RelativeTimeFormat`. */
  static formatRelativeTime(date: string | null | undefined, now: Date, language?: string): string {
    const time = date ? new Date(date).getTime() : Number.NaN;
    if (Number.isNaN(time)) {
      return '';
    }
    const seconds = Math.round((time - now.getTime()) / 1000);
    const formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    const absolute = Math.abs(seconds);
    if (absolute < 60) {
      return formatter.format(0, 'minute');
    }
    if (absolute < 3600) {
      return formatter.format(Math.round(seconds / 60), 'minute');
    }
    if (absolute < 86_400) {
      return formatter.format(Math.round(seconds / 3600), 'hour');
    }
    return formatter.format(Math.round(seconds / 86_400), 'day');
  }
}
