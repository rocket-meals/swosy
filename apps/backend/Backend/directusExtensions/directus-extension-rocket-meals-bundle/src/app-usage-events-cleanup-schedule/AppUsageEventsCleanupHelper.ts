/**
 * AppUsageEventsCleanupHelper.ts – which `app_usage_events` the daily cleanup deletes.
 *
 * The events are anonymous, but they pile up quickly (every opened food offer is one). The page
 * "Live-Puls" only looks at today, so 30 days are plenty for the statistics.
 */

import type { Filter } from '@directus/types';

export const APP_USAGE_EVENTS_CLEANUP_WORKFLOW_ID = 'app-usage-events-cleanup';

/** Not part of `CollectionNames`: adding it there would make every hook wait for this table. */
export const APP_USAGE_EVENTS_COLLECTION = 'app_usage_events';

export class AppUsageEventsCleanupHelper {
  public static readonly MAX_AGE_DAYS = 30;
  public static readonly BATCH_SIZE = 1000;
  /** Upper bound per run; whatever is left is deleted the next day. */
  public static readonly MAX_ITERATIONS = 100;

  static getCutoffDate(now: Date, maxAgeDays: number = AppUsageEventsCleanupHelper.MAX_AGE_DAYS): Date {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - maxAgeDays);
    return cutoff;
  }

  /** Events created before the cutoff. */
  static buildFilter(cutoff: Date): Filter {
    return { date_created: { _lt: cutoff.toISOString() } };
  }
}
