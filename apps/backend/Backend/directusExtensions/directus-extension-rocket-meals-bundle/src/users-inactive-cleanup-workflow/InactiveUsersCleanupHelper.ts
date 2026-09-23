import { DatabaseTypes } from 'repo-depkit-common';

export const INACTIVE_USERS_CLEANUP_WORKFLOW_ID = 'users-inactive-cleanup';

/** The privacy policy promises deletion after 180 days of inactivity. */
export const INACTIVE_USERS_CLEANUP_DEFAULT_DAYS_INACTIVE = 180;

export enum InactiveUsersCleanupInputKeys {
  delete_users = 'delete_users',
  days_inactive = 'days_inactive',
}

export type InactiveUsersCleanupInput = {
  [InactiveUsersCleanupInputKeys.delete_users]: boolean;
  [InactiveUsersCleanupInputKeys.days_inactive]: number;
};

export type InactiveUsersCleanupInputParseResult = { input: InactiveUsersCleanupInput; error?: undefined } | { input?: undefined; error: string };

export const INACTIVE_USERS_CLEANUP_EXPECTED_INPUT =
  '{ "' + InactiveUsersCleanupInputKeys.delete_users + '": <boolean>, "' + InactiveUsersCleanupInputKeys.days_inactive + '"?: <positive integer, default ' + INACTIVE_USERS_CLEANUP_DEFAULT_DAYS_INACTIVE + '> }';

/**
 * Fields read per user: the policies attached to the user directly, to its role and to the role's parent.
 * Directus 11 grants admin access through any of them.
 */
export const INACTIVE_USERS_CLEANUP_USER_FIELDS = [
  'id',
  'last_access',
  'profile',
  'policies.policy.admin_access',
  'role.policies.policy.admin_access',
  'role.parent.policies.policy.admin_access',
];

type PolicyAccessEntry = { policy?: string | { admin_access?: boolean | null } | null } | string | null | undefined;
type RoleWithPolicies = { policies?: PolicyAccessEntry[] | null; parent?: RoleWithPolicies | string | null } | string | null | undefined;

export type InactiveUserCandidate = {
  id: string;
  last_access?: string | null;
  profile?: string | DatabaseTypes.Profiles | null;
  policies?: PolicyAccessEntry[] | null;
  role?: RoleWithPolicies;
};

export class InactiveUsersCleanupHelper {
  /**
   * Parses the workflow run input. Anything but a JSON object with a boolean `delete_users` fails,
   * so a run started without (or with mistyped) data never deletes users by accident.
   */
  static parseInput(rawInput: unknown): InactiveUsersCleanupInputParseResult {
    if (rawInput === undefined || rawInput === null || rawInput === '') {
      return { error: 'No input given.' };
    }

    let parsed: unknown = rawInput;
    if (typeof rawInput === 'string') {
      try {
        parsed = JSON.parse(rawInput);
      } catch (e) {
        return { error: 'Input is not valid JSON: ' + (e instanceof Error ? e.message : String(e)) };
      }
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { error: 'Input must be a JSON object.' };
    }

    const inputObject = parsed as Record<string, unknown>;
    const allowedKeys = Object.values(InactiveUsersCleanupInputKeys) as string[];
    const unknownKeys = Object.keys(inputObject).filter(key => !allowedKeys.includes(key));
    if (unknownKeys.length > 0) {
      return { error: 'Unknown input keys: ' + unknownKeys.join(', ') };
    }

    const deleteUsers = inputObject[InactiveUsersCleanupInputKeys.delete_users];
    if (typeof deleteUsers !== 'boolean') {
      return { error: '"' + InactiveUsersCleanupInputKeys.delete_users + '" is required and must be a boolean.' };
    }

    const daysInactiveRaw = inputObject[InactiveUsersCleanupInputKeys.days_inactive];
    let daysInactive = INACTIVE_USERS_CLEANUP_DEFAULT_DAYS_INACTIVE;
    if (daysInactiveRaw !== undefined && daysInactiveRaw !== null) {
      if (typeof daysInactiveRaw !== 'number' || !Number.isInteger(daysInactiveRaw) || daysInactiveRaw < 1) {
        return { error: '"' + InactiveUsersCleanupInputKeys.days_inactive + '" must be a positive integer.' };
      }
      daysInactive = daysInactiveRaw;
    }

    return {
      input: {
        [InactiveUsersCleanupInputKeys.delete_users]: deleteUsers,
        [InactiveUsersCleanupInputKeys.days_inactive]: daysInactive,
      },
    };
  }

  static getCutoffDate(now: Date, daysInactive: number): Date {
    return new Date(now.getTime() - daysInactive * 24 * 60 * 60 * 1000);
  }

  private static hasAdminPolicy(policies: PolicyAccessEntry[] | null | undefined): boolean {
    return (policies || []).some(entry => {
      if (typeof entry !== 'object' || entry === null) {
        return false;
      }
      const policy = entry.policy;
      return typeof policy === 'object' && policy !== null && policy.admin_access === true;
    });
  }

  /** True when a policy of the user, its role or the role's parent grants admin access. */
  static isAdmin(user: InactiveUserCandidate): boolean {
    if (InactiveUsersCleanupHelper.hasAdminPolicy(user.policies)) {
      return true;
    }
    let role: RoleWithPolicies = user.role;
    // guard against a misconfigured role cycle
    for (let depth = 0; depth < 10 && typeof role === 'object' && role !== null; depth++) {
      if (InactiveUsersCleanupHelper.hasAdminPolicy(role.policies)) {
        return true;
      }
      role = role.parent;
    }
    return false;
  }

  static getProfileId(user: InactiveUserCandidate): string | undefined {
    const profile = user.profile;
    if (!profile) {
      return undefined;
    }
    return typeof profile === 'string' ? profile : profile.id;
  }
}
