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

/** `session_id` prefix of every event written by the backend. */
export const BACKEND_USAGE_SESSION_PREFIX = 'Backend_';

export const BACKEND_USAGE_EVENT_TYPE_FOOD = 'food';
export const BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED = 'food_details_opened';

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
