import { describe, expect, it } from '@jest/globals';
import { Accountability } from '@directus/types';
import { BACKEND_USAGE_EVENT_NAME_FOOD_DETAILS_OPENED, BackendUsageEventHelper } from '../BackendUsageEventHelper';

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
});
