import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { ALL_APP_USAGE_EVENT_NAMES, APP_USAGE_EVENTS_DISABLE_ALL, APP_USAGE_SCREEN_OPENED_EVENT_NAMES, AppUsageEventNames, isAppUsageEventEnabled } from '../AppUsageEventNames';

const SNAPSHOT_FIELD = path.join(__dirname, '../../../../data/directus-sync-data/configuration/directus-config/snapshot/fields/app_settings/app_usage_events_enabled.json');

describe('isAppUsageEventEnabled', () => {
  it('collects every event while nothing is selected', () => {
    expect(isAppUsageEventEnabled(null, AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(true);
    expect(isAppUsageEventEnabled(undefined, AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(true);
    expect(isAppUsageEventEnabled([], AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(true);
  });

  it('collects only the selected events', () => {
    const setting = [AppUsageEventNames.MAP_SCREEN_OPENED, AppUsageEventNames.FOOD_DETAILS_OPENED];
    expect(isAppUsageEventEnabled(setting, AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(true);
    expect(isAppUsageEventEnabled(setting, AppUsageEventNames.FOOD_DETAILS_OPENED)).toBe(true);
    expect(isAppUsageEventEnabled(setting, AppUsageEventNames.NEWS_SCREEN_OPENED)).toBe(false);
  });

  it('collects nothing with "disable all", whatever else is selected', () => {
    for (const eventName of ALL_APP_USAGE_EVENT_NAMES) {
      expect(isAppUsageEventEnabled([APP_USAGE_EVENTS_DISABLE_ALL], eventName)).toBe(false);
      expect(isAppUsageEventEnabled([APP_USAGE_EVENTS_DISABLE_ALL, eventName], eventName)).toBe(false);
    }
  });

  it('reads a list stored as JSON string and ignores unreadable values', () => {
    expect(isAppUsageEventEnabled(JSON.stringify([AppUsageEventNames.NEWS_SCREEN_OPENED]), AppUsageEventNames.NEWS_SCREEN_OPENED)).toBe(true);
    expect(isAppUsageEventEnabled(JSON.stringify([AppUsageEventNames.NEWS_SCREEN_OPENED]), AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(false);
    expect(isAppUsageEventEnabled('not json', AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(true);
    expect(isAppUsageEventEnabled({ some: 'object' }, AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(true);
  });
});

describe('AppUsageEventNames', () => {
  it('has unique names and lists every screen event among all events', () => {
    expect(new Set(ALL_APP_USAGE_EVENT_NAMES).size).toBe(ALL_APP_USAGE_EVENT_NAMES.length);
    for (const eventName of APP_USAGE_SCREEN_OPENED_EVENT_NAMES) {
      expect(ALL_APP_USAGE_EVENT_NAMES).toContain(eventName);
    }
  });

  it('offers exactly these events in app_settings, with "disable all" on top', () => {
    const field = JSON.parse(fs.readFileSync(SNAPSHOT_FIELD, 'utf8'));
    const values: string[] = field.meta.options.choices.map((choice: { value: string }) => choice.value);
    expect(values[0]).toBe(APP_USAGE_EVENTS_DISABLE_ALL);
    expect([...values.slice(1)].sort()).toEqual([...ALL_APP_USAGE_EVENT_NAMES].sort());
  });
});
