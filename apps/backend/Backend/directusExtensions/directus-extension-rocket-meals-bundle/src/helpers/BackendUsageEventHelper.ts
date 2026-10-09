/**
 * BackendUsageEventHelper.ts – usage events that the backend writes itself into `app_usage_events`.
 *
 * The app reports a few events on its own (`AppUsageEventHelper` in the frontend). Some things the
 * server sees anyway, e.g. that the details of a food offer were loaded – those are written here,
 * without an app release and for every app version.
 *
 * The events stay anonymous like the ones of the app: no user, no profile, no IP. Instead of the
 * random session id of the app they carry `Backend_<Year>_<Month>_<Day>`, so they are recognisable
 * as backend events and are never counted as an open app session.
 */

import { Accountability } from '@directus/types';
import { AccountabilityHelper } from './AccountabilityHelper';
import { KeyValueStore, SharedStore } from './RedisHelper';
import { BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED, BACKEND_USAGE_EVENT_TYPE_FOOD, BACKEND_USAGE_SESSION_PREFIX } from './BackendUsageEventNames';

export { BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED, BACKEND_USAGE_EVENT_TYPE_FOOD, BACKEND_USAGE_SESSION_PREFIX };

export type BackendUsageEvent = {
  event_type: string;
  event_name: string;
  session_id: string;
  payload: Record<string, unknown>;
};

type RelatedItem = { id?: string | number | null; alias?: string | null } | string | number | null | undefined;

export type FoodofferForUsageEvent = {
  id?: string | number | null;
  alias?: string | null;
  food?: RelatedItem;
  canteen?: RelatedItem;
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function getRelatedId(related: RelatedItem): string | undefined {
  if (related === null || related === undefined) {
    return undefined;
  }
  if (typeof related === 'object') {
    return related.id !== null && related.id !== undefined ? String(related.id) : undefined;
  }
  return String(related);
}

function getRelatedAlias(related: RelatedItem): string | undefined {
  return related && typeof related === 'object' ? related.alias || undefined : undefined;
}

export class BackendUsageEventHelper {
  /**
   * Window in which repeated reads of the same food offer by the same requester count once. The
   * details screen of the app reads `/items/foodoffers/<id>` several times when it opens (details,
   * labels, components) – without this every opening would be counted two or three times.
   */
  public static readonly DEDUPLICATION_WINDOW_MS = 60_000;

  /**
   * Who asked, only to recognise repeated reads – kept in memory for `DEDUPLICATION_WINDOW_MS`,
   * never written to the event. The user, else the IP of a request without login.
   */
  static getRequesterKey(accountability: Accountability | null | undefined): string {
    return accountability?.user ? `user:${accountability.user}` : `ip:${accountability?.ip ?? 'unknown'}`;
  }

  /** `Backend_2026_10_07` – the day in the time zone of the server (`TZ`, Europe/Berlin in production). */
  static getSessionId(date: Date): string {
    return `${BACKEND_USAGE_SESSION_PREFIX}${date.getFullYear()}_${pad(date.getMonth() + 1)}_${pad(date.getDate())}`;
  }

  static isBackendSessionId(sessionId: string | null | undefined): boolean {
    return typeof sessionId === 'string' && sessionId.startsWith(BACKEND_USAGE_SESSION_PREFIX);
  }

  /**
   * The key when a read asked for exactly one item – what `ItemsService.readOne` does for
   * `GET /items/<collection>/<id>`: it adds `{ <primary key>: { _eq: <id> } }` to the filter.
   * List reads (`GET /items/foodoffers?filter=…`) return `undefined`.
   */
  static getSingleReadKey(query: unknown, primaryKeyField: string = 'id'): string | undefined {
    const filter = (query as { filter?: Record<string, unknown> } | null | undefined)?.filter;
    const condition = filter?.[primaryKeyField] as { _eq?: unknown } | undefined;
    const key = condition?._eq;
    return typeof key === 'string' || typeof key === 'number' ? String(key) : undefined;
  }

  /**
   * Only reads that come from the apps count: there is a request (reads of hooks and schedules run
   * without accountability) and nobody with access to the Directus app – admins and staff looking
   * at a food offer in the backend are not app usage. Requests without login (web) count.
   */
  static isAppRequest(accountability: Accountability | null | undefined): boolean {
    if (!accountability) {
      return false;
    }
    if (!accountability.user) {
      return true;
    }
    return !AccountabilityHelper.isAppAccessAccountability(accountability);
  }

  static buildFoodDetailsOpenedEvent(foodoffer: FoodofferForUsageEvent | undefined, foodofferId: string, now: Date): BackendUsageEvent {
    return {
      event_type: BACKEND_USAGE_EVENT_TYPE_FOOD,
      event_name: BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED,
      session_id: BackendUsageEventHelper.getSessionId(now),
      payload: {
        foodoffer_id: foodofferId,
        food_id: getRelatedId(foodoffer?.food) ?? null,
        food_name: getRelatedAlias(foodoffer?.food) ?? foodoffer?.alias ?? null,
        canteen_id: getRelatedId(foodoffer?.canteen) ?? null,
      },
    };
  }
}

/**
 * Remembers which requester read which food offer, so that one opening of the details counts once.
 * The details screen reads `/items/foodoffers/<id>` several times when it opens, and the load
 * balancer spreads these reads over the Directus replicas – so the lock lives in the `SharedStore`
 * (Redis with `REDIS`, else memory of this process). `setIfAbsent` is atomic in Redis: exactly one
 * read per window wins, whichever replica it hits.
 */
export class BackendUsageEventDeduplicator {
  public static readonly KEY_PREFIX = 'rocket-meals:usage-event-dedup:';

  constructor(
    env: Record<string, unknown> | null | undefined,
    private readonly windowMs: number = BackendUsageEventHelper.DEDUPLICATION_WINDOW_MS,
    private readonly store: KeyValueStore = new SharedStore(env)
  ) {}

  /** `true` when the read should be counted – and from then on the same pair is skipped for the window. */
  async shouldCount(requesterKey: string, itemKey: string): Promise<boolean> {
    return this.store.setIfAbsent(`${BackendUsageEventDeduplicator.KEY_PREFIX}${requesterKey}|${itemKey}`, '1', this.windowMs);
  }
}
