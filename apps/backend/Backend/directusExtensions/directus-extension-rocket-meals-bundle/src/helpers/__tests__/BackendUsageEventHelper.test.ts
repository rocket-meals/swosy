import { describe, expect, it } from '@jest/globals';
import { Accountability } from '@directus/types';
import {
  BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED,
  BackendUsageEventDeduplicator,
  BackendUsageEventHelper,
  BackendUsageEventLockStore,
  BackendUsageEventSharedDeduplicator,
} from '../BackendUsageEventHelper';

function accountability(values: Partial<Accountability>): Accountability {
  return { role: null, roles: [], user: null, admin: false, app: false, ip: null, ...values } as Accountability;
}

describe('BackendUsageEventHelper', () => {
  it('uses the day as session id, recognisable as backend', () => {
    const sessionId = BackendUsageEventHelper.getSessionId(new Date(2026, 0, 5, 23, 59));
    expect(sessionId).toBe('Backend_2026_01_05');
    expect(BackendUsageEventHelper.isBackendSessionId(sessionId)).toBe(true);
    expect(BackendUsageEventHelper.isBackendSessionId('7f3c0b2e-1111-4a4a-9c9c-123456789abc')).toBe(false);
    expect(BackendUsageEventHelper.isBackendSessionId(null)).toBe(false);
  });

  it('recognises the single read of GET /items/foodoffers/<id> and ignores list reads', () => {
    expect(BackendUsageEventHelper.getSingleReadKey({ fields: ['*'], filter: { id: { _eq: 'abc' } } })).toBe('abc');
    expect(BackendUsageEventHelper.getSingleReadKey({ filter: { id: { _eq: 42 } } })).toBe('42');
    expect(BackendUsageEventHelper.getSingleReadKey({ filter: { _and: [{ id: { _in: ['a', 'b'] } }] } })).toBeUndefined();
    expect(BackendUsageEventHelper.getSingleReadKey({ filter: { canteen: { _eq: 'c' } } })).toBeUndefined();
    expect(BackendUsageEventHelper.getSingleReadKey({})).toBeUndefined();
    expect(BackendUsageEventHelper.getSingleReadKey(undefined)).toBeUndefined();
  });

  it('counts app users and requests without login, not admins, staff or other hooks', () => {
    expect(BackendUsageEventHelper.isAppRequest(accountability({ user: 'u1' }))).toBe(true);
    expect(BackendUsageEventHelper.isAppRequest(accountability({ user: null, app: true }))).toBe(true);
    expect(BackendUsageEventHelper.isAppRequest(accountability({ user: 'admin', admin: true, app: true }))).toBe(false);
    expect(BackendUsageEventHelper.isAppRequest(accountability({ user: 'staff', app: true }))).toBe(false);
    expect(BackendUsageEventHelper.isAppRequest(null)).toBe(false);
    expect(BackendUsageEventHelper.isAppRequest(undefined)).toBe(false);
  });

  it('builds an anonymous event with the food from the read result', () => {
    const now = new Date(2026, 9, 7, 12, 30);
    const event = BackendUsageEventHelper.buildFoodDetailsOpenedEvent({ id: 'o1', alias: 'Angebot', food: { id: 'f1', alias: 'Currywurst' }, canteen: 'c1' }, 'o1', now);
    expect(event).toEqual({
      event_type: 'food',
      event_name: BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED,
      session_id: 'Backend_2026_10_07',
      payload: { foodoffer_id: 'o1', food_id: 'f1', food_name: 'Currywurst', canteen_id: 'c1' },
    });
    expect(JSON.stringify(event)).not.toMatch(/user|profile|ip/);
  });

  it('falls back to the alias of the offer when the food is not expanded', () => {
    const event = BackendUsageEventHelper.buildFoodDetailsOpenedEvent({ id: 'o1', alias: 'Tagesgericht', food: 'f1' }, 'o1', new Date());
    expect(event.payload).toMatchObject({ food_id: 'f1', food_name: 'Tagesgericht' });
    expect(BackendUsageEventHelper.buildFoodDetailsOpenedEvent(undefined, 'o2', new Date()).payload).toMatchObject({ foodoffer_id: 'o2', food_id: null, food_name: null });
  });

  it('identifies the requester by user, else by IP', () => {
    expect(BackendUsageEventHelper.getRequesterKey(accountability({ user: 'u1', ip: '1.2.3.4' }))).toBe('user:u1');
    expect(BackendUsageEventHelper.getRequesterKey(accountability({ ip: '1.2.3.4' }))).toBe('ip:1.2.3.4');
    expect(BackendUsageEventHelper.getRequesterKey(undefined)).toBe('ip:unknown');
  });

  it('counts repeated reads of the same food offer by the same requester once per window', () => {
    const deduplicator = new BackendUsageEventDeduplicator(60_000);
    expect(deduplicator.shouldCount('user:u1', 'offer-1', 0)).toBe(true);
    // the details screen reads the offer again right away (labels, components)
    expect(deduplicator.shouldCount('user:u1', 'offer-1', 300)).toBe(false);
    expect(deduplicator.shouldCount('user:u1', 'offer-1', 1_200)).toBe(false);
    // another offer or another person counts
    expect(deduplicator.shouldCount('user:u1', 'offer-2', 1_500)).toBe(true);
    expect(deduplicator.shouldCount('user:u2', 'offer-1', 1_500)).toBe(true);
    // opened again after the window
    expect(deduplicator.shouldCount('user:u1', 'offer-1', 60_000)).toBe(true);
  });

  it('forgets expired entries so the memory does not grow', () => {
    const deduplicator = new BackendUsageEventDeduplicator(1_000);
    deduplicator.shouldCount('a', 'x', 0);
    deduplicator.shouldCount('b', 'y', 100);
    expect(deduplicator.size).toBe(2);
    deduplicator.shouldCount('c', 'z', 5_000);
    expect(deduplicator.size).toBe(1);
  });

  it('shares the lock between replicas so one opening counts once', async () => {
    // a minimal Redis: SET … PX … NX with expiry, shared by two "replicas"
    let now = 0;
    const entries = new Map<string, number>();
    const store: BackendUsageEventLockStore = {
      set: async (key, _value, _mode, time) => {
        const expiresAt = entries.get(key);
        if (expiresAt !== undefined && expiresAt > now) {
          return null;
        }
        entries.set(key, now + time);
        return 'OK';
      },
    };
    const replicaA = new BackendUsageEventSharedDeduplicator(store, 60_000);
    const replicaB = new BackendUsageEventSharedDeduplicator(store, 60_000);

    expect(await replicaA.shouldCount('user:u1', 'offer-1', now)).toBe(true);
    now = 300;
    expect(await replicaB.shouldCount('user:u1', 'offer-1', now)).toBe(false);
    expect(await replicaB.shouldCount('user:u2', 'offer-1', now)).toBe(true);
    now = 60_000;
    expect(await replicaB.shouldCount('user:u1', 'offer-1', now)).toBe(true);
  });

  it('falls back to the local lock when Redis fails', async () => {
    const store: BackendUsageEventLockStore = {
      set: async () => {
        throw new Error('redis down');
      },
    };
    const deduplicator = new BackendUsageEventSharedDeduplicator(store, 60_000);
    expect(await deduplicator.shouldCount('user:u1', 'offer-1', 0)).toBe(true);
    expect(await deduplicator.shouldCount('user:u1', 'offer-1', 300)).toBe(false);
  });
});
