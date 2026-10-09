/**
 * Shared rules for `feature_whishes`, used by the app and by the backend hooks.
 *
 * One collection holds three kinds of rows, told apart by `status`:
 * - a wish (with a title) that goes through moderation: draft → ai_suggests_* → published or archived
 * - a duplicate of another wish (`merged`, `related_to` = the original)
 * - a like (`like`, `related_to` = the liked wish, no text)
 *
 * `likes_amount` of a wish is the number of `merged` and `like` rows pointing to it.
 */

export enum FeatureWishStatus {
  DRAFT = 'draft',
  AI_SUGGESTS_PUBLISH = 'ai_suggests_publish',
  AI_SUGGESTS_DECLINE = 'ai_suggests_decline',
  AI_SUGGESTS_MERGE = 'ai_suggests_merge',
  PUBLISHED = 'published',
  MERGED = 'merged',
  LIKE = 'like',
  ARCHIVED = 'archived',
}

export enum FeatureWishProgress {
  COLLECTED = 'collected',
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  RELEASED = 'released',
  NOT_PLANNED = 'not_planned',
}

/** The fields of a wish the helper needs. Structural on purpose, so it works with `DatabaseTypes.FeatureWhishes`. */
export type FeatureWishLike = {
  id?: string;
  status?: string | null;
  title?: string | null;
  description?: string | null;
  related_to?: string | { id: string } | null;
  date_updated?: string | null;
  date_created?: string | null;
};

export type FeatureWishCreateInput = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  related_to?: unknown;
};

export enum FeatureWishCreateError {
  TITLE_MISSING = 'title_missing',
  TITLE_TOO_LONG = 'title_too_long',
  DESCRIPTION_TOO_LONG = 'description_too_long',
}

export type FeatureWishCreatePayload = {
  id?: string;
  status: FeatureWishStatus.DRAFT | FeatureWishStatus.LIKE;
  title: string | null;
  description: string | null;
  related_to: string | null;
  profile?: string | null;
};

export type FeatureWishCreateResult = { ok: true; isLike: boolean; payload: FeatureWishCreatePayload } | { ok: false; error: FeatureWishCreateError };

export class FeatureWishHelper {
  static readonly TITLE_MAX_LENGTH = 80;
  static readonly DESCRIPTION_MAX_LENGTH = 1000;
  /** Archived wishes are deleted this many days after their last change. */
  static readonly ARCHIVED_DELETE_AFTER_DAYS = 30;
  /** How many wishes a device may submit per day (counted in the app). */
  static readonly MAX_WISHES_PER_DAY = 3;
  /** How long a hidden tile in the food offers stays hidden. */
  static readonly TILE_HIDDEN_DAYS = 30;
  /** Maximum number of ids the status endpoint answers per request. */
  static readonly STATUS_ENDPOINT_MAX_IDS = 50;

  private static readonly UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  /** Rows that add to `likes_amount` of the wish in `related_to`. */
  static readonly COUNTING_STATUSES: string[] = [FeatureWishStatus.MERGED, FeatureWishStatus.LIKE];

  /** Statuses in which the author may still edit title and description. */
  static readonly EDITABLE_STATUSES: string[] = [
    FeatureWishStatus.DRAFT,
    FeatureWishStatus.AI_SUGGESTS_PUBLISH,
    FeatureWishStatus.AI_SUGGESTS_DECLINE,
    FeatureWishStatus.AI_SUGGESTS_MERGE,
    FeatureWishStatus.ARCHIVED,
  ];

  /** Statuses that are still waiting for a decision of a human. */
  static readonly IN_REVIEW_STATUSES: string[] = [
    FeatureWishStatus.DRAFT,
    FeatureWishStatus.AI_SUGGESTS_PUBLISH,
    FeatureWishStatus.AI_SUGGESTS_DECLINE,
    FeatureWishStatus.AI_SUGGESTS_MERGE,
  ];

  static getRelatedToId(wish: Pick<FeatureWishLike, 'related_to'> | null | undefined): string | null {
    const relatedTo = wish?.related_to;
    if (!relatedTo) {
      return null;
    }
    return typeof relatedTo === 'string' ? relatedTo : relatedTo.id;
  }

  static isLike(wish: Pick<FeatureWishLike, 'status'> | null | undefined): boolean {
    return wish?.status === FeatureWishStatus.LIKE;
  }

  static countsAsLike(wish: Pick<FeatureWishLike, 'status'> | null | undefined): boolean {
    return !!wish?.status && FeatureWishHelper.COUNTING_STATUSES.includes(wish.status);
  }

  static isEditable(wish: Pick<FeatureWishLike, 'status'> | null | undefined): boolean {
    return !!wish?.status && FeatureWishHelper.EDITABLE_STATUSES.includes(wish.status);
  }

  static isInReview(wish: Pick<FeatureWishLike, 'status'> | null | undefined): boolean {
    return !!wish?.status && FeatureWishHelper.IN_REVIEW_STATUSES.includes(wish.status);
  }

  private static normalizeText(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  /** Validates title and description of a wish. Returns the cleaned values or the first error. */
  static validateText(input: { title?: unknown; description?: unknown }): { ok: true; title: string; description: string | null } | { ok: false; error: FeatureWishCreateError } {
    const title = FeatureWishHelper.normalizeText(input.title);
    if (!title) {
      return { ok: false, error: FeatureWishCreateError.TITLE_MISSING };
    }
    if (title.length > FeatureWishHelper.TITLE_MAX_LENGTH) {
      return { ok: false, error: FeatureWishCreateError.TITLE_TOO_LONG };
    }
    const description = FeatureWishHelper.normalizeText(input.description);
    if (description && description.length > FeatureWishHelper.DESCRIPTION_MAX_LENGTH) {
      return { ok: false, error: FeatureWishCreateError.DESCRIPTION_TOO_LONG };
    }
    return { ok: true, title, description };
  }

  /**
   * Turns what an app user sent into the row that may be stored: a like when `related_to` is set
   * (never with text), otherwise a wish in `draft`. Everything else the request contained is dropped.
   */
  static buildCreatePayload(input: FeatureWishCreateInput, profileId: string | null): FeatureWishCreateResult {
    const relatedTo = FeatureWishHelper.normalizeText(input.related_to);
    const id = FeatureWishHelper.normalizeText(input.id);
    const base: Partial<FeatureWishCreatePayload> = {};
    if (id) {
      base.id = id;
    }
    if (profileId) {
      base.profile = profileId;
    }

    if (relatedTo) {
      return {
        ok: true,
        isLike: true,
        payload: { ...base, status: FeatureWishStatus.LIKE, title: null, description: null, related_to: relatedTo },
      };
    }

    const text = FeatureWishHelper.validateText(input);
    if (!text.ok) {
      return text;
    }
    return {
      ok: true,
      isLike: false,
      payload: { ...base, status: FeatureWishStatus.DRAFT, title: text.title, description: text.description, related_to: null },
    };
  }

  /** Counts the `merged` and `like` rows per wish they point to. */
  static countLikesByWishId(rows: FeatureWishLike[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const relatedToId = FeatureWishHelper.getRelatedToId(row);
      if (!relatedToId || !FeatureWishHelper.countsAsLike(row)) {
        continue;
      }
      counts[relatedToId] = (counts[relatedToId] ?? 0) + 1;
    }
    return counts;
  }

  /** The day an archived wish is deleted, counted from its last change. Null when the wish is not archived. */
  static getArchivedDeletionDate(wish: Pick<FeatureWishLike, 'status' | 'date_updated' | 'date_created'>): Date | null {
    if (wish.status !== FeatureWishStatus.ARCHIVED) {
      return null;
    }
    const lastChange = wish.date_updated ?? wish.date_created;
    if (!lastChange) {
      return null;
    }
    const date = new Date(lastChange);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    date.setDate(date.getDate() + FeatureWishHelper.ARCHIVED_DELETE_AFTER_DAYS);
    return date;
  }

  /** The latest last-change date an archived wish may have before the cleanup deletes it. */
  static getArchivedDeletionCutoff(now: Date): Date {
    const cutoff = new Date(now.getTime());
    cutoff.setDate(cutoff.getDate() - FeatureWishHelper.ARCHIVED_DELETE_AFTER_DAYS);
    return cutoff;
  }

  /**
   * Follows `related_to` from a wish to the wish that is not merged itself. Stops on cycles and
   * after a few steps, so a broken chain never loops.
   */
  static resolveMergeTarget(startId: string, getRelatedToOfMerged: (id: string) => string | null): string {
    const visited = new Set<string>([startId]);
    let current = startId;
    for (let step = 0; step < 10; step++) {
      const next = getRelatedToOfMerged(current);
      if (!next || visited.has(next)) {
        return current;
      }
      visited.add(next);
      current = next;
    }
    return current;
  }

  /** Whether the tile in the food offers may show again, given when it was hidden. */
  static isTileHidden(hiddenAtIso: string | null | undefined, now: Date): boolean {
    if (!hiddenAtIso) {
      return false;
    }
    const hiddenAt = new Date(hiddenAtIso);
    if (Number.isNaN(hiddenAt.getTime())) {
      return false;
    }
    const showAgainAt = new Date(hiddenAt.getTime());
    showAgainAt.setDate(showAgainAt.getDate() + FeatureWishHelper.TILE_HIDDEN_DAYS);
    return now.getTime() < showAgainAt.getTime();
  }

  /** The submissions of the last 24 hours. */
  static getRecentSubmissions(submittedAtIsoList: string[] | null | undefined, now: Date): string[] {
    const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;
    return (submittedAtIsoList ?? []).filter(iso => {
      const time = new Date(iso).getTime();
      return !Number.isNaN(time) && time > dayAgo;
    });
  }

  /**
   * The ids for the status endpoint from a query parameter (`?ids=a,b` or `?ids=a&ids=b`): unique,
   * only UUIDs, at most `STATUS_ENDPOINT_MAX_IDS`.
   */
  static parseStatusIds(value: unknown): string[] {
    const rawValues = Array.isArray(value) ? value : [value];
    const ids: string[] = [];
    for (const raw of rawValues) {
      if (typeof raw !== 'string') {
        continue;
      }
      for (const part of raw.split(',')) {
        const id = part.trim().toLowerCase();
        if (FeatureWishHelper.UUID_PATTERN.test(id) && !ids.includes(id)) {
          ids.push(id);
        }
      }
    }
    return ids.slice(0, FeatureWishHelper.STATUS_ENDPOINT_MAX_IDS);
  }

  static maySubmitAnotherWish(submittedAtIsoList: string[] | null | undefined, now: Date): boolean {
    return FeatureWishHelper.getRecentSubmissions(submittedAtIsoList, now).length < FeatureWishHelper.MAX_WISHES_PER_DAY;
  }
}
