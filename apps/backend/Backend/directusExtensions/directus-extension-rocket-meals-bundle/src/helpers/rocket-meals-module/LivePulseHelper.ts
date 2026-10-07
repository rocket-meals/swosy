/**
 * LivePulseHelper.ts – data side of the page "Live-Puls" (`live-pulse-page.vue`): who was active
 * lately, what is happening in the app right now and how busy today was.
 *
 * Sources, all read with the permissions of the person looking at the page:
 * - `profiles.date_updated` – last activity of a profile (the app touches it when it is opened).
 * - `foods_feedbacks`, `canteen_visits`, new `profiles` – the ticker.
 * - `app_usage_events` – anonymous usage events, only counted, never linked to a profile.
 * - `directus_activity` – distinct users per hour for the chart.
 *
 * No Vue in here, so the rules are testable in Node.
 */

import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';

type DirectusFilter = Record<string, unknown>;

/** Not (yet) part of `CollectionNames`: adding them there would make every hook wait for these tables. */
const CANTEEN_VISITS = 'canteen_visits';
const APP_USAGE_EVENTS = 'app_usage_events';

export enum LivePulsePresence {
  /** Active within the last `ACTIVE_NOW_MINUTES`. */
  NOW = 'now',
  /** Active within the last `ACTIVE_RECENT_MINUTES`. */
  RECENT = 'recent',
  /** Active earlier today. */
  TODAY = 'today',
}

export enum LivePulseFeedType {
  RATING = 'rating',
  COMMENT = 'comment',
  CANTEEN_VISIT = 'canteen_visit',
  NEW_PROFILE = 'new_profile',
  USAGE_EVENT = 'usage_event',
}

export type LivePulseProfile = {
  id: string;
  nickname?: string | null;
  avatar?: unknown;
  date_updated?: string | null;
  date_created?: string | null;
};

type RelatedProfile = LivePulseProfile | string | null | undefined;

export type LivePulseFoodFeedback = {
  id: string;
  rating?: number | null;
  comment?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  food?: { id: string; alias?: string | null } | string | null;
  canteen?: { id: string; alias?: string | null } | string | null;
  profile?: RelatedProfile;
};

export type LivePulseCanteenVisit = {
  id: string;
  date?: string | null;
  date_created?: string | null;
  canteen?: { id: string; alias?: string | null } | string | null;
  profile?: RelatedProfile;
};

export type LivePulseUsageEvent = {
  id: string;
  event_type?: string | null;
  event_name?: string | null;
  screen_name?: string | null;
  platform?: string | null;
  date_created?: string | null;
};

export type LivePulseFeedItem = {
  /** Unique across all sources, stable between refreshes – used as list key and to spot new entries. */
  key: string;
  type: LivePulseFeedType;
  date: string;
  profile?: LivePulseProfile;
  rating?: number | null;
  comment?: string | null;
  foodName?: string;
  canteenName?: string;
  /** For a canteen visit: the day of the planned visit (`YYYY-MM-DD`). */
  visitDate?: string | null;
  eventName?: string | null;
  screenName?: string | null;
  platform?: string | null;
};

export type LivePulseQuery = {
  fields?: string;
  filter?: string;
  sort?: string;
  limit?: number;
  aggregate?: string;
};

export class LivePulseHelper {
  /** How often the page reloads its data. */
  public static readonly REFRESH_INTERVAL_MS = 30_000;
  public static readonly ACTIVE_NOW_MINUTES = 15;
  public static readonly ACTIVE_RECENT_MINUTES = 60;
  /** Avatars shown on the wall. */
  public static readonly PROFILE_LIMIT = 30;
  /** Entries loaded per ticker source; the merged ticker shows `FEED_LIMIT` of them. */
  public static readonly FEED_SOURCE_LIMIT = 15;
  public static readonly FEED_LIMIT = 25;
  public static readonly AVATAR_SIZE = 64;
  public static readonly FEED_AVATAR_SIZE = 36;

  /**
   * Collections in which app users leave traces in `directus_activity`. Restricting the chart to
   * these keeps staff editing foods or news in Directus out of it.
   */
  public static readonly APP_ACTIVITY_COLLECTIONS: readonly string[] = ['directus_users', CollectionNames.PROFILES, CollectionNames.FOODS_FEEDBACKS, CANTEEN_VISITS, CollectionNames.DEVICES, CollectionNames.CHAT_MESSAGES, CollectionNames.FRIENDSHIPS, CollectionNames.COLLECTIBLE_EVENT_PARTICIPANTS, CollectionNames.APP_FEEDBACKS, CollectionNames.FORM_SUBMISSIONS];

  static readonly PROFILES_ENDPOINT = `/items/${CollectionNames.PROFILES}`;
  static readonly FOOD_FEEDBACKS_ENDPOINT = `/items/${CollectionNames.FOODS_FEEDBACKS}`;
  static readonly CANTEEN_VISITS_ENDPOINT = `/items/${CANTEEN_VISITS}`;
  static readonly APP_USAGE_EVENTS_ENDPOINT = `/items/${APP_USAGE_EVENTS}`;
  static readonly ACTIVITY_ENDPOINT = '/activity';
  /** Path of `profile-avatar-endpoint`, relative to the API root. */
  static readonly AVATAR_ENDPOINT = 'profile-avatar';

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
    if (minutesAgo <= LivePulseHelper.ACTIVE_RECENT_MINUTES) {
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

  /** Profiles active today, most recent first. */
  static buildActiveProfilesQuery(now: Date): LivePulseQuery {
    return {
      fields: LivePulseHelper.PROFILE_FIELDS.join(','),
      filter: JSON.stringify({ date_updated: { _gte: LivePulseHelper.getStartOfDay(now).toISOString() } }),
      sort: '-date_updated',
      limit: LivePulseHelper.PROFILE_LIMIT,
    };
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
      fields: ['id', 'rating', 'comment', 'date_created', 'date_updated', 'food.id', 'food.alias', 'canteen.id', 'canteen.alias', ...LivePulseHelper.relatedProfileFields()].join(','),
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

  static buildUsageEventsQuery(now: Date): LivePulseQuery {
    return {
      fields: ['id', 'event_type', 'event_name', 'screen_name', 'platform', 'date_created'].join(','),
      filter: JSON.stringify(LivePulseHelper.buildCreatedSinceFilter(LivePulseHelper.getStartOfDay(now))),
      sort: '-date_created',
      limit: LivePulseHelper.FEED_SOURCE_LIMIT,
    };
  }

  /** Anonymous app sessions that sent an event within the last `ACTIVE_NOW_MINUTES`. */
  static buildOpenSessionsQuery(now: Date): LivePulseQuery {
    return LivePulseHelper.buildCountDistinctQuery(LivePulseHelper.buildCreatedSinceFilter(LivePulseHelper.minutesBefore(now, LivePulseHelper.ACTIVE_NOW_MINUTES)), 'session_id');
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

  static getProfile(profile: RelatedProfile): LivePulseProfile | undefined {
    return profile && typeof profile === 'object' ? profile : undefined;
  }

  private static getAlias(relation: { alias?: string | null } | string | null | undefined): string | undefined {
    return relation && typeof relation === 'object' ? relation.alias || undefined : undefined;
  }

  /** Merges all ticker sources into one list, newest first. */
  static buildFeed(sources: { foodFeedbacks?: LivePulseFoodFeedback[]; canteenVisits?: LivePulseCanteenVisit[]; newProfiles?: LivePulseProfile[]; usageEvents?: LivePulseUsageEvent[] }): LivePulseFeedItem[] {
    const items: LivePulseFeedItem[] = [];

    for (const feedback of sources.foodFeedbacks ?? []) {
      const date = feedback.date_updated || feedback.date_created;
      if (!date) continue;
      items.push({
        key: `feedback-${feedback.id}-${date}`,
        type: feedback.comment ? LivePulseFeedType.COMMENT : LivePulseFeedType.RATING,
        date,
        profile: LivePulseHelper.getProfile(feedback.profile),
        rating: feedback.rating,
        comment: feedback.comment,
        foodName: LivePulseHelper.getAlias(feedback.food),
        canteenName: LivePulseHelper.getAlias(feedback.canteen),
      });
    }

    for (const visit of sources.canteenVisits ?? []) {
      if (!visit.date_created) continue;
      items.push({
        key: `visit-${visit.id}`,
        type: LivePulseFeedType.CANTEEN_VISIT,
        date: visit.date_created,
        profile: LivePulseHelper.getProfile(visit.profile),
        canteenName: LivePulseHelper.getAlias(visit.canteen),
        visitDate: visit.date ? visit.date.slice(0, 10) : null,
      });
    }

    for (const profile of sources.newProfiles ?? []) {
      if (!profile.date_created) continue;
      items.push({ key: `profile-${profile.id}`, type: LivePulseFeedType.NEW_PROFILE, date: profile.date_created, profile });
    }

    for (const event of sources.usageEvents ?? []) {
      if (!event.date_created) continue;
      items.push({
        key: `event-${event.id}`,
        type: LivePulseFeedType.USAGE_EVENT,
        date: event.date_created,
        eventName: event.event_name,
        screenName: event.screen_name,
        platform: event.platform,
      });
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, LivePulseHelper.FEED_LIMIT);
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

  /** Short, stable hash (djb2) – only used to version URLs. */
  static hashString(value: string): string {
    let hash = 5381;
    for (let index = 0; index < value.length; index++) {
      hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0;
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
