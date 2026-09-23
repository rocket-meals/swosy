import { describe, expect, it } from '@jest/globals';
import { INACTIVE_USERS_CLEANUP_DEFAULT_DAYS_INACTIVE, InactiveUsersCleanupHelper } from '../InactiveUsersCleanupHelper';

describe('InactiveUsersCleanupHelper.parseInput', () => {
  it('accepts a JSON string or an object and defaults days_inactive', () => {
    expect(InactiveUsersCleanupHelper.parseInput('{"delete_users": false}')).toEqual({ delete_users: false, days_inactive: INACTIVE_USERS_CLEANUP_DEFAULT_DAYS_INACTIVE });
    expect(InactiveUsersCleanupHelper.parseInput({ delete_users: true, days_inactive: 30 })).toEqual({ delete_users: true, days_inactive: 30 });
  });

  it('fails without a boolean delete_users or with an invalid days_inactive', () => {
    expect(() => InactiveUsersCleanupHelper.parseInput(null)).toThrow();
    expect(() => InactiveUsersCleanupHelper.parseInput('{}')).toThrow();
    expect(() => InactiveUsersCleanupHelper.parseInput('{"delete_users": "true"}')).toThrow();
    expect(() => InactiveUsersCleanupHelper.parseInput('{"delete_users": false, "days_inactive": 0}')).toThrow();
  });
});
