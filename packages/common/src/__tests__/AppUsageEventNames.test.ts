import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { ALL_APP_USAGE_EVENT_NAMES, APP_USAGE_EVENT_CHOICES, APP_USAGE_SCREEN_OPENED_EVENT_NAMES, AppUsageEventChoice, AppUsageEventNames, isAppUsageEventEnabled } from '../AppUsageEventNames';

const SNAPSHOT_FIELD = path.join(__dirname, '../../../../data/directus-sync-data/configuration/directus-config/snapshot/fields/app_settings/app_usage_events_enabled.json');

function collectLeaves(choices: AppUsageEventChoice[]): string[] {
  return choices.flatMap(choice => (choice.children ? collectLeaves(choice.children) : [choice.value]));
}

function collectGroups(choices: AppUsageEventChoice[]): string[] {
  return choices.flatMap(choice => (choice.children ? [choice.value, ...collectGroups(choice.children)] : []));
}

describe('isAppUsageEventEnabled', () => {
  it('collects every event while the setting does not exist yet', () => {
    expect(isAppUsageEventEnabled(null, AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(true);
    expect(isAppUsageEventEnabled(undefined, AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(true);
  });

  it('collects only the ticked events', () => {
    const setting = [AppUsageEventNames.MAP_SCREEN_OPENED, AppUsageEventNames.FOOD_DETAILS_OPENED];
    expect(isAppUsageEventEnabled(setting, AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(true);
    expect(isAppUsageEventEnabled(setting, AppUsageEventNames.FOOD_DETAILS_OPENED)).toBe(true);
    expect(isAppUsageEventEnabled(setting, AppUsageEventNames.NEWS_SCREEN_OPENED)).toBe(false);
  });

  it('collects everything with "Alle" ticked and nothing with nothing ticked', () => {
    for (const eventName of ALL_APP_USAGE_EVENT_NAMES) {
      expect(isAppUsageEventEnabled([...ALL_APP_USAGE_EVENT_NAMES], eventName)).toBe(true);
      expect(isAppUsageEventEnabled([], eventName)).toBe(false);
    }
  });

  it('reads a list stored as JSON string and ignores unreadable values', () => {
    expect(isAppUsageEventEnabled(JSON.stringify([AppUsageEventNames.NEWS_SCREEN_OPENED]), AppUsageEventNames.NEWS_SCREEN_OPENED)).toBe(true);
    expect(isAppUsageEventEnabled(JSON.stringify([AppUsageEventNames.NEWS_SCREEN_OPENED]), AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(false);
    expect(isAppUsageEventEnabled('not json', AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(true);
    expect(isAppUsageEventEnabled({ some: 'object' }, AppUsageEventNames.MAP_SCREEN_OPENED)).toBe(true);
  });
});

describe('APP_USAGE_EVENT_CHOICES', () => {
  it('has unique names and lists every screen event among all events', () => {
    expect(new Set(ALL_APP_USAGE_EVENT_NAMES).size).toBe(ALL_APP_USAGE_EVENT_NAMES.length);
    for (const eventName of APP_USAGE_SCREEN_OPENED_EVENT_NAMES) {
      expect(ALL_APP_USAGE_EVENT_NAMES).toContain(eventName);
    }
  });

  it('has "Alle" on top and every event exactly once below it, groups never named like an event', () => {
    expect(APP_USAGE_EVENT_CHOICES).toHaveLength(1);
    expect(APP_USAGE_EVENT_CHOICES[0]!.text).toBe('Alle');
    const leaves = collectLeaves(APP_USAGE_EVENT_CHOICES);
    expect([...leaves].sort()).toEqual([...ALL_APP_USAGE_EVENT_NAMES].sort());
    for (const group of collectGroups(APP_USAGE_EVENT_CHOICES)) {
      expect(ALL_APP_USAGE_EVENT_NAMES as readonly string[]).not.toContain(group);
    }
  });

  it('matches the checkbox tree in app_settings, which stores only the events and starts with all ticked', () => {
    const field = JSON.parse(fs.readFileSync(SNAPSHOT_FIELD, 'utf8'));
    expect(field.meta.interface).toBe('select-multiple-checkbox-tree');
    expect(field.meta.options.valueCombining).toBe('leaf');
    expect(field.meta.options.choices).toEqual(APP_USAGE_EVENT_CHOICES);
    expect([...field.schema.default_value].sort()).toEqual([...ALL_APP_USAGE_EVENT_NAMES].sort());
  });
});
