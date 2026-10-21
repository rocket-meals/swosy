/**
 * UniversityAffiliationHelper.ts – the status (student, staff, …) a university login reports.
 *
 * Logging in via DFN-AAI (provider `dfn`, Shibboleth behind the DFN OIDC proxy), the home university
 * sends `eduperson_scoped_affiliation`, e.g. `["student@uni-hannover.de", "member@uni-hannover.de"]`.
 * Directus hands these claims to hooks only during the login (`auth.create` / `auth.update`) and
 * keeps none of them. The hook `university-affiliation-hook` therefore remembers them in the
 * `SharedStore`, keyed by provider and external identifier, and `university-affiliation-endpoint`
 * shows them to the logged-in user. For testing only: nothing in the app relies on it yet.
 *
 * Directus flattens the claims before the hook sees them, an array arrives as
 * `eduperson_scoped_affiliation.0`, `eduperson_scoped_affiliation.1`, … – `extractAffiliations`
 * reads both forms.
 */

import { SharedStore } from './RedisHelper';

export const SCOPED_AFFILIATION_CLAIM = 'eduperson_scoped_affiliation';
export const AFFILIATION_CLAIM = 'eduperson_affiliation';

/** How long a login's status is kept. A new login of the user replaces it. */
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const KEY_PREFIX = 'university_affiliation_';

export type UniversityAffiliationRecord = {
  provider: string;
  /** Values of `eduperson_scoped_affiliation`, e.g. `student@uni-hannover.de`. */
  scoped_affiliations: string[];
  /** Values of `eduperson_affiliation` (without university), e.g. `student`. */
  affiliations: string[];
  /** Names of all claims the login delivered – shows which scopes were granted. No values. */
  received_claims: string[];
  recorded_at: string;
};

export type UniversityAffiliationStatus = {
  is_student: boolean;
  is_employee: boolean;
  /** Universities from the scoped values, e.g. `uni-hannover.de`. */
  universities: string[];
};

function toValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(toValues);
  }
  if (typeof value === 'string') {
    // Some identity providers send several values in one string.
    return value.split(/[\s,;]+/).filter(part => part.length > 0);
  }
  return [];
}

export class UniversityAffiliationHelper {
  /** One store per process, so hook and endpoint share the in-memory fallback without Redis. */
  private static store: SharedStore | null = null;

  private static getStore(): SharedStore {
    if (!UniversityAffiliationHelper.store) {
      UniversityAffiliationHelper.store = new SharedStore(process.env);
    }
    return UniversityAffiliationHelper.store;
  }

  /** All values of `claim` in the (possibly flattened) claims, lower case, without duplicates. */
  static extractClaimValues(claims: Record<string, unknown> | null | undefined, claim: string): string[] {
    if (!claims) {
      return [];
    }
    const values = Object.entries(claims)
      .filter(([key]) => key === claim || key.startsWith(claim + '.'))
      .flatMap(([, value]) => toValues(value))
      .map(value => value.trim().toLowerCase());
    return [...new Set(values)];
  }

  /** Claim names without the array index Directus adds when flattening (`x.0` → `x`). */
  static extractClaimNames(claims: Record<string, unknown> | null | undefined): string[] {
    const names = Object.keys(claims ?? {}).map(key => key.replace(/\.\d+$/, ''));
    return [...new Set(names)].sort();
  }

  static createRecord(provider: string, claims: Record<string, unknown> | null | undefined, now: Date = new Date()): UniversityAffiliationRecord {
    return {
      provider,
      scoped_affiliations: UniversityAffiliationHelper.extractClaimValues(claims, SCOPED_AFFILIATION_CLAIM),
      affiliations: UniversityAffiliationHelper.extractClaimValues(claims, AFFILIATION_CLAIM),
      received_claims: UniversityAffiliationHelper.extractClaimNames(claims),
      recorded_at: now.toISOString(),
    };
  }

  static getStatus(record: Pick<UniversityAffiliationRecord, 'scoped_affiliations' | 'affiliations'>): UniversityAffiliationStatus {
    const scoped = record.scoped_affiliations.map(value => {
      const at = value.indexOf('@');
      return at < 0 ? { role: value, university: null } : { role: value.slice(0, at), university: value.slice(at + 1) };
    });
    const roles = new Set([...scoped.map(entry => entry.role), ...record.affiliations]);
    const universities = scoped.map(entry => entry.university).filter((university): university is string => !!university);
    return {
      is_student: roles.has('student'),
      // `staff` is a subset of `employee`, some universities send only one of the two.
      is_employee: roles.has('employee') || roles.has('staff') || roles.has('faculty'),
      universities: [...new Set(universities)],
    };
  }

  /** The answer of `GET /university-affiliation`: the stored record, or a hint when there is none. */
  static toResponse(provider: string | null, record: UniversityAffiliationRecord | null): Record<string, unknown> {
    if (!record) {
      return {
        provider,
        has_affiliation_data: false,
        hint: provider === 'dfn' ? 'No data stored yet. Log in again via "Uni/Hochschule".' : 'Only logins via "Uni/Hochschule" (provider dfn) report a status.',
      };
    }
    return {
      provider,
      has_affiliation_data: true,
      ...UniversityAffiliationHelper.getStatus(record),
      scoped_affiliations: record.scoped_affiliations,
      affiliations: record.affiliations,
      received_claims: record.received_claims,
      recorded_at: record.recorded_at,
    };
  }

  private static getKey(provider: string, identifier: string): string {
    return KEY_PREFIX + provider + ':' + identifier;
  }

  static async save(identifier: string, record: UniversityAffiliationRecord): Promise<void> {
    await UniversityAffiliationHelper.getStore().set({
      key: UniversityAffiliationHelper.getKey(record.provider, identifier),
      value: JSON.stringify(record),
      ttlMs: TTL_MS,
    });
  }

  static async load(provider: string, identifier: string): Promise<UniversityAffiliationRecord | null> {
    const value = await UniversityAffiliationHelper.getStore().get(UniversityAffiliationHelper.getKey(provider, identifier));
    return value ? (JSON.parse(value) as UniversityAffiliationRecord) : null;
  }
}
