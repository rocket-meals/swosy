export const INACTIVE_USERS_CLEANUP_WORKFLOW_ID = 'users-inactive-cleanup';

/** The privacy policy promises deletion after 180 days of inactivity. */
export const INACTIVE_USERS_CLEANUP_DEFAULT_DAYS_INACTIVE = 180;

export const INACTIVE_USERS_CLEANUP_EXPECTED_INPUT = '{ "delete_users": <boolean>, "days_inactive"?: <number >= 1, default ' + INACTIVE_USERS_CLEANUP_DEFAULT_DAYS_INACTIVE + '> }';

export type InactiveUsersCleanupInput = {
  delete_users: boolean;
  days_inactive: number;
};

export class InactiveUsersCleanupHelper {
  /** A JSON string or an object; throws when `delete_users` is missing or `days_inactive` is not a number >= 1. */
  static parseInput(rawInput: unknown): InactiveUsersCleanupInput {
    const parsed = typeof rawInput === 'string' ? JSON.parse(rawInput) : rawInput;
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Input must be a JSON object');
    }
    const { delete_users, days_inactive } = parsed as Partial<Record<keyof InactiveUsersCleanupInput, unknown>>;
    if (typeof delete_users !== 'boolean') {
      throw new Error('"delete_users" must be a boolean');
    }
    if (days_inactive !== undefined && (typeof days_inactive !== 'number' || !(days_inactive >= 1))) {
      throw new Error('"days_inactive" must be a number >= 1');
    }
    return {
      delete_users: delete_users,
      days_inactive: days_inactive ?? INACTIVE_USERS_CLEANUP_DEFAULT_DAYS_INACTIVE,
    };
  }
}
