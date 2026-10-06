import { describe, expect, it } from '@jest/globals';
import type { Accountability } from '@directus/types';
import { AccountabilityHelper } from '../AccountabilityHelper';

const accountability = (overrides: Partial<Accountability>): Accountability => ({ user: 'user-id', role: null, roles: [], admin: false, app: false, ip: null, ...overrides }) as Accountability;

describe('AccountabilityHelper.isAppAccessAccountability', () => {
  it('treats admins as backend users', () => {
    expect(AccountabilityHelper.isAppAccessAccountability(accountability({ admin: true }))).toBe(true);
  });

  it('treats staff with app access but without admin rights as backend users', () => {
    expect(AccountabilityHelper.isAppAccessAccountability(accountability({ app: true }))).toBe(true);
  });

  it('does not treat app users (API only) as backend users', () => {
    expect(AccountabilityHelper.isAppAccessAccountability(accountability({}))).toBe(false);
  });

  it('is false without accountability', () => {
    expect(AccountabilityHelper.isAppAccessAccountability(null)).toBe(false);
    expect(AccountabilityHelper.isAppAccessAccountability(undefined)).toBe(false);
  });
});
