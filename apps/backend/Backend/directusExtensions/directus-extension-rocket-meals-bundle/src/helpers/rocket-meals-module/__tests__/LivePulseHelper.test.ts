import { describe, expect, it } from '@jest/globals';
import { LivePulseFeedType, LivePulseHelper, LivePulsePresence } from '../LivePulseHelper';
import { RocketMealsModulePages } from '../RocketMealsModulePages';
import { BackendTranslationKeys } from '../../translations/BackendTranslationKeys';

const NOW = new Date(2026, 9, 7, 12, 41, 30);

function minutesAgo(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString();
}

describe('LivePulseHelper', () => {
  describe('getPresence', () => {
    it('is "now" within the active window, "recent" within the hour, "today" after that', () => {
      expect(LivePulseHelper.getPresence(minutesAgo(1), NOW)).toBe(LivePulsePresence.NOW);
      expect(LivePulseHelper.getPresence(minutesAgo(LivePulseHelper.ACTIVE_NOW_MINUTES), NOW)).toBe(LivePulsePresence.NOW);
      expect(LivePulseHelper.getPresence(minutesAgo(LivePulseHelper.ACTIVE_NOW_MINUTES + 1), NOW)).toBe(LivePulsePresence.RECENT);
      expect(LivePulseHelper.getPresence(minutesAgo(LivePulseHelper.ACTIVE_RECENT_MINUTES + 1), NOW)).toBe(LivePulsePresence.TODAY);
    });

    it('treats a missing or broken date as "today"', () => {
      expect(LivePulseHelper.getPresence(null, NOW)).toBe(LivePulsePresence.TODAY);
      expect(LivePulseHelper.getPresence('not a date', NOW)).toBe(LivePulsePresence.TODAY);
    });

    it('has a label for every presence', () => {
      expect(LivePulseHelper.getPresenceLabelKey(LivePulsePresence.NOW)).toBe(BackendTranslationKeys.rocket_meals_module_live_pulse_presence_now);
      expect(LivePulseHelper.getPresenceLabelKey(LivePulsePresence.RECENT)).toBe(BackendTranslationKeys.rocket_meals_module_live_pulse_presence_recent);
      expect(LivePulseHelper.getPresenceLabelKey(LivePulsePresence.TODAY)).toBe(BackendTranslationKeys.rocket_meals_module_live_pulse_presence_today);
    });
  });

  describe('queries', () => {
    it('loads the profiles active since local midnight, most recent first', () => {
      const query = LivePulseHelper.buildActiveProfilesQuery(NOW);
      expect(query.sort).toBe('-date_updated');
      expect(query.limit).toBe(LivePulseHelper.PROFILE_LIMIT);
      expect(JSON.parse(query.filter!)).toEqual({ date_updated: { _gte: new Date(2026, 9, 7).toISOString() } });
      expect(query.fields).toContain('avatar');
      expect(query.fields).toContain('nickname');
    });

    it('counts the food details loaded today', () => {
      const query = LivePulseHelper.buildFoodViewsTodayQuery(NOW);
      expect(JSON.parse(query.aggregate!)).toEqual({ count: 'id' });
      expect(JSON.parse(query.filter!)).toEqual({ _and: [{ date_created: { _gte: new Date(2026, 9, 7).toISOString() } }, { event_name: { _eq: 'food_details_opened' } }] });
    });

    it('counts distinct app users per hour and leaves staff edits of other collections out', () => {
      const [start, end] = [new Date(2026, 9, 7, 11), new Date(2026, 9, 7, 12)];
      const query = LivePulseHelper.buildActivityHourQuery(start, end);
      expect(JSON.parse(query.aggregate!)).toEqual({ countDistinct: 'user' });
      const filter = JSON.parse(query.filter!);
      expect(filter._and).toContainEqual({ timestamp: { _gte: start.toISOString() } });
      expect(filter._and).toContainEqual({ timestamp: { _lt: end.toISOString() } });
      const collections = filter._and.find((part: Record<string, unknown>) => 'collection' in part).collection._in;
      expect(collections).toContain('profiles');
      expect(collections).not.toContain('foods');
    });
  });

  describe('getHourBuckets', () => {
    it('has one bucket per hour from midnight up to the current hour, in local time', () => {
      const buckets = LivePulseHelper.getHourBuckets(NOW);
      expect(buckets).toHaveLength(13);
      expect(buckets[0]!.start).toEqual(new Date(2026, 9, 7, 0));
      expect(buckets[12]!.start).toEqual(new Date(2026, 9, 7, 12));
      expect(buckets[12]!.end).toEqual(new Date(2026, 9, 7, 13));
    });
  });

  describe('readAggregate', () => {
    it('reads count and countDistinct, also as string, and falls back to 0', () => {
      expect(LivePulseHelper.readAggregate([{ count: { id: '7' } }], 'count', 'id')).toBe(7);
      expect(LivePulseHelper.readAggregate([{ countDistinct: { user: 4 } }], 'countDistinct', 'user')).toBe(4);
      expect(LivePulseHelper.readAggregate([], 'count', 'id')).toBe(0);
      expect(LivePulseHelper.readAggregate(undefined, 'count', 'id')).toBe(0);
    });
  });

  describe('buildFeed', () => {
    it('merges all sources newest first', () => {
      const feed = LivePulseHelper.buildFeed({
        foodFeedbacks: [
          { id: 'f1', rating: 4, date_created: minutesAgo(3), date_updated: minutesAgo(3), food: { id: 'food', alias: 'Spaghetti' }, canteen: { id: 'c', alias: 'Mensa' }, profile: { id: 'p1', nickname: 'Lena' } },
          { id: 'f2', rating: 2, comment: 'Zu salzig', date_created: minutesAgo(30), profile: 'p2' },
        ],
        canteenVisits: [{ id: 'v1', date: '2026-10-08', date_created: minutesAgo(1), canteen: { id: 'c', alias: 'Mensa' }, profile: { id: 'p3', nickname: 'Tim' } }],
        newProfiles: [{ id: 'p4', nickname: 'Jonas', date_created: minutesAgo(10) }],
        usageEvents: [{ id: 'e1', event_name: 'food_details_opened', platform: 'ios', date_created: minutesAgo(0) }],
      });
      expect(feed.map(item => item.type)).toEqual([LivePulseFeedType.FOOD_OPENED, LivePulseFeedType.CANTEEN_VISIT, LivePulseFeedType.RATING, LivePulseFeedType.NEW_PROFILE, LivePulseFeedType.COMMENT]);
      expect(feed[1]).toMatchObject({ canteenName: 'Mensa', visitDate: '2026-10-08', profile: { nickname: 'Tim' } });
      expect(feed[2]).toMatchObject({ foodName: 'Spaghetti', rating: 4, profile: { nickname: 'Lena' } });
      // Not expanded relation → no profile, the page shows "no nickname".
      expect(feed[4]!.profile).toBeUndefined();
    });

    it('shows food views written by the backend with the name of the food', () => {
      const feed = LivePulseHelper.buildFeed({
        usageEvents: [
          { id: 'e1', event_name: 'food_details_opened', session_id: 'Backend_2026_10_07', payload: { food_name: 'Currywurst' }, date_created: minutesAgo(1) },
          { id: 'e2', event_name: 'native_review_prompt_requested', date_created: minutesAgo(2) },
        ],
      });
      expect(feed[0]).toMatchObject({ type: LivePulseFeedType.FOOD_OPENED, foodName: 'Currywurst' });
      expect(feed[1]).toMatchObject({ type: LivePulseFeedType.USAGE_EVENT, eventName: 'native_review_prompt_requested' });
    });

    it('gives a changed rating a new key, so it shows up as new in the ticker', () => {
      const before = LivePulseHelper.buildFeed({ foodFeedbacks: [{ id: 'f1', rating: 3, date_updated: minutesAgo(10) }] });
      const after = LivePulseHelper.buildFeed({ foodFeedbacks: [{ id: 'f1', rating: 5, date_updated: minutesAgo(0) }] });
      expect(before[0]!.key).not.toBe(after[0]!.key);
    });

    it('keeps at most FEED_LIMIT entries and skips entries without date', () => {
      const newProfiles = Array.from({ length: LivePulseHelper.FEED_LIMIT + 5 }, (_, index) => ({ id: `p${index}`, date_created: minutesAgo(index) }));
      expect(LivePulseHelper.buildFeed({ newProfiles })).toHaveLength(LivePulseHelper.FEED_LIMIT);
      expect(LivePulseHelper.buildFeed({ newProfiles: [{ id: 'x' }] })).toHaveLength(0);
    });
  });

  describe('avatars', () => {
    const avatar = { style: 'avataaars', size: 128, options: { top: ['bob'] } };

    it('recognises an avatar config as object or JSON string', () => {
      expect(LivePulseHelper.hasAvatar({ id: 'p', avatar })).toBe(true);
      expect(LivePulseHelper.hasAvatar({ id: 'p', avatar: JSON.stringify(avatar) })).toBe(true);
      expect(LivePulseHelper.hasAvatar({ id: 'p', avatar: null })).toBe(false);
      expect(LivePulseHelper.hasAvatar({ id: 'p', avatar: '{broken' })).toBe(false);
      expect(LivePulseHelper.hasAvatar({ id: 'p', avatar: { options: {} } })).toBe(false);
    });

    it('builds the endpoint URL with size and a version that changes with the avatar', () => {
      const url = LivePulseHelper.getAvatarUrl({ id: 'p 1', avatar }, 64, 'http://localhost:8055');
      expect(url).toMatch(/^http:\/\/localhost:8055\/profile-avatar\/p%201\?size=64&v=[a-z0-9]+$/);
      const changed = LivePulseHelper.getAvatarUrl({ id: 'p 1', avatar: { ...avatar, options: { top: ['bun'] } } }, 64, 'http://localhost:8055/');
      expect(changed).not.toBe(url);
      expect(LivePulseHelper.getAvatarUrl({ id: 'p', avatar: null }, 64)).toBeUndefined();
    });

    it('falls back to initials', () => {
      expect(LivePulseHelper.getInitials('Lena')).toBe('LE');
      expect(LivePulseHelper.getInitials('Noah Klein')).toBe('NK');
      expect(LivePulseHelper.getInitials('  ')).toBe('?');
      expect(LivePulseHelper.getInitials(null)).toBe('?');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats in the given language', () => {
      expect(LivePulseHelper.formatRelativeTime(minutesAgo(5), NOW, 'de')).toBe('vor 5 Minuten');
      expect(LivePulseHelper.formatRelativeTime(minutesAgo(5), NOW, 'en')).toBe('5 minutes ago');
      expect(LivePulseHelper.formatRelativeTime(minutesAgo(170), NOW, 'de')).toBe('vor 3 Stunden');
      expect(LivePulseHelper.formatRelativeTime(null, NOW, 'de')).toBe('');
    });
  });

  it('is a page of the module', () => {
    expect(RocketMealsModulePages.PAGES).toContain(RocketMealsModulePages.LIVE_PULSE);
    expect(RocketMealsModulePages.getRoute(RocketMealsModulePages.LIVE_PULSE)).toBe('/rocket-meals/live-pulse');
  });
});
