import { describe, expect, it } from '@jest/globals';
import { AppUsageEventsCleanupHelper } from '../AppUsageEventsCleanupHelper';

describe('AppUsageEventsCleanupHelper', () => {
  it('keeps the events of the last 30 days', () => {
    const now = new Date(2026, 9, 31, 4, 0, 0);
    expect(AppUsageEventsCleanupHelper.getCutoffDate(now)).toEqual(new Date(2026, 9, 1, 4, 0, 0));
    expect(AppUsageEventsCleanupHelper.getCutoffDate(now, 1)).toEqual(new Date(2026, 9, 30, 4, 0, 0));
  });

  it('deletes only events created before the cutoff', () => {
    const cutoff = new Date('2026-10-01T02:00:00.000Z');
    expect(AppUsageEventsCleanupHelper.buildFilter(cutoff)).toEqual({ date_created: { _lt: '2026-10-01T02:00:00.000Z' } });
  });
});
