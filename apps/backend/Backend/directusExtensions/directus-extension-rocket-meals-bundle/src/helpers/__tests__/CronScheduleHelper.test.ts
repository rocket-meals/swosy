import { describe, expect, it } from '@jest/globals';
import { CronHelper } from 'repo-depkit-common';
import { CronScheduleHelper } from '../CronScheduleHelper';

// Thursday, 8 October 2026, 10:42:30 local time
const NOW = new Date(2026, 9, 8, 10, 42, 30);

describe('CronScheduleHelper', () => {
  describe('getNextRuns', () => {
    it('steps every 5 minutes from the next full step', () => {
      const runs = CronScheduleHelper.getNextRuns(CronHelper.getCronString(CronHelper.EVERY_5_MINUTES), NOW, 3);
      expect(runs).toEqual([new Date(2026, 9, 8, 10, 45, 0), new Date(2026, 9, 8, 10, 50, 0), new Date(2026, 9, 8, 10, 55, 0)]);
    });

    it('fires a daily schedule today when the time is still ahead, else tomorrow', () => {
      expect(CronScheduleHelper.getNextRuns(CronHelper.getCronString(CronHelper.EVERY_DAY_AT_17_59), NOW, 2)).toEqual([new Date(2026, 9, 8, 17, 59, 0), new Date(2026, 9, 9, 17, 59, 0)]);
      expect(CronScheduleHelper.getNextRuns(CronHelper.getCronString(CronHelper.EVERY_DAY_AT_4AM), NOW, 1)).toEqual([new Date(2026, 9, 9, 4, 0, 0)]);
    });

    it('is strictly after the given time', () => {
      expect(CronScheduleHelper.getNextRuns('0 0 * * * *', new Date(2026, 9, 8, 10, 0, 0), 1)).toEqual([new Date(2026, 9, 8, 11, 0, 0)]);
    });

    it('handles monthly and weekly schedules', () => {
      expect(CronScheduleHelper.getNextRuns(CronHelper.getCronString(CronHelper.EVERY_MONTH_AT_1AM), NOW, 2)).toEqual([new Date(2026, 10, 1, 1, 0, 0), new Date(2026, 11, 1, 1, 0, 0)]);
      expect(CronScheduleHelper.getNextRuns(CronHelper.getCronString(CronHelper.EVERY_FRIDAY_AT_8AM), NOW, 1)).toEqual([new Date(2026, 9, 9, 8, 0, 0)]);
    });

    it('reads classic 5 field cron strings, ranges and lists', () => {
      expect(CronScheduleHelper.getNextRuns('0 3 * * *', NOW, 1)).toEqual([new Date(2026, 9, 9, 3, 0, 0)]);
      expect(CronScheduleHelper.getNextRuns('15,45 9-11 * * 1-5', NOW, 3)).toEqual([new Date(2026, 9, 8, 10, 45, 0), new Date(2026, 9, 8, 11, 15, 0), new Date(2026, 9, 8, 11, 45, 0)]);
    });

    it('takes Sunday as 0 and as 7', () => {
      expect(CronScheduleHelper.getNextRuns('0 12 * * 7', NOW, 1)).toEqual([new Date(2026, 9, 11, 12, 0, 0)]);
      expect(CronScheduleHelper.getNextRuns('0 12 * * 0', NOW, 1)).toEqual([new Date(2026, 9, 11, 12, 0, 0)]);
    });

    it('throws for a broken cron string', () => {
      expect(() => CronScheduleHelper.getNextRuns('every day', NOW, 1)).toThrow();
      expect(() => CronScheduleHelper.getNextRuns('0 99 * * *', NOW, 1)).toThrow();
    });
  });

  describe('describe', () => {
    it('recognizes the schedules of CronHelper', () => {
      expect(CronScheduleHelper.describe(CronHelper.getCronString(CronHelper.EVERY_MINUTE))).toEqual({ kind: 'every_minute' });
      expect(CronScheduleHelper.describe(CronHelper.getCronString(CronHelper.EVERY_15_MINUTES))).toEqual({ kind: 'every_minutes', minutes: 15 });
      expect(CronScheduleHelper.describe(CronHelper.getCronString(CronHelper.EVERY_HOUR))).toEqual({ kind: 'hourly', minute: 0 });
      expect(CronScheduleHelper.describe(CronHelper.getCronString(CronHelper.EVERY_DAY_AT_17_59))).toEqual({ kind: 'daily', hour: 17, minute: 59 });
      expect(CronScheduleHelper.describe(CronHelper.getCronString(CronHelper.EVERY_FRIDAY_AT_8AM))).toEqual({ kind: 'weekly', weekday: 5, hour: 8, minute: 0 });
      expect(CronScheduleHelper.describe(CronHelper.getCronString(CronHelper.EVERY_MONTH_AT_1AM))).toEqual({ kind: 'monthly', day: 1, hour: 1, minute: 0 });
    });

    it('calls everything else custom', () => {
      expect(CronScheduleHelper.describe('0 0 4 * 1 *')).toEqual({ kind: 'custom' });
      expect(CronScheduleHelper.describe('0 15,45 * * * *')).toEqual({ kind: 'custom' });
      expect(CronScheduleHelper.describe('not a cron')).toEqual({ kind: 'custom' });
    });
  });
});
