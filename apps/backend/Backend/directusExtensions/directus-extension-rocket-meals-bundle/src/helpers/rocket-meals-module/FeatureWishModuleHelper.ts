/**
 * FeatureWishModuleHelper.ts – the Directus side of the page "Feature-Wünsche" in the module
 * `Rocket Meals`: which fields and endpoints it reads, how the list is filtered and sorted, how a
 * status, an AI suggestion and a progress look.
 *
 * The rules of the collection – wishes, duplicates and likes in one table, which statuses wait for
 * review, how likes are counted – live in `repo-depkit-common` (`FeatureWishHelper`), so the app,
 * the `feature-wishes-hook` and the `feature-wishes-daily-workflow` use exactly the same ones.
 * Likes are rows as well; they never show up on this page.
 *
 * Plain logic without Vue or Directus app imports, so it can be unit tested in Node.
 */

// Not the package index: this file is bundled into the Directus app, see BackendTranslator.ts.
import { CollectionNames } from 'repo-depkit-common/src/databaseTypes/CollectionNames';
import { FeatureWishHelper, FeatureWishProgress, FeatureWishStatus } from 'repo-depkit-common/src/FeatureWishHelper';
import { RelationHelper } from 'repo-depkit-common/src/RelationHelper';
import { BackendTranslationKeys } from '../translations/BackendTranslationKeys';
import { FoodFeedbackChatHelper } from './FoodFeedbackChatHelper';
import { ProfileDetailsHelper, type ModuleProfile } from './ProfileDetailsHelper';

/** The fields the list and the details page need from a wish, with the relations it expands. */
export type FeatureWishListItem = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  progress?: string | null;
  likes_amount?: number | null;
  /** Visible to everyone in the app, e.g. why a wish is not planned. */
  moderation_note_public?: string | null;
  /** Only for the backend, the AI writes its reasons here. */
  moderation_note_intern?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  related_to?: { id: string; title?: string | null; status?: string | null } | string | null;
  profile?: ModuleProfile | string | null;
  chat?: { id: string; conversation_state?: string | null; date_updated?: string | null } | string | null;
};

/** The status chips of the list. Likes are never listed. */
export enum FeatureWishListFilter {
  /** Draft or an AI suggestion: waits for a decision of a human. */
  IN_REVIEW = 'in_review',
  PUBLISHED = 'published',
  MERGED = 'merged',
  ARCHIVED = 'archived',
  ALL = 'all',
}

export enum FeatureWishListSort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  MOST_LIKES = 'most_likes',
}

/** Everything the list can be narrowed down by, besides the status chips. */
export type FeatureWishListOptions = {
  /** Only wishes with one of these progresses; empty = every progress, also none. */
  progresses?: readonly FeatureWishProgress[] | null;
  sort?: FeatureWishListSort | null;
  pageSize?: number | null;
};

/** What the AI suggested for a wish in review, and the status a human gives it when agreeing. */
export type FeatureWishSuggestion = {
  labelKey: BackendTranslationKeys;
  icon: string;
  acceptStatus: FeatureWishStatus.PUBLISHED | FeatureWishStatus.ARCHIVED | FeatureWishStatus.MERGED;
};

export type FeatureWishPresentation = {
  labelKey: BackendTranslationKeys;
  icon: string;
  /** A Directus theme colour variable, so the chip works in light and dark mode. */
  color: string;
};

type DirectusFilter = Record<string, unknown>;

export class FeatureWishModuleHelper {
  public static readonly FILTERS: readonly FeatureWishListFilter[] = [FeatureWishListFilter.IN_REVIEW, FeatureWishListFilter.PUBLISHED, FeatureWishListFilter.MERGED, FeatureWishListFilter.ARCHIVED, FeatureWishListFilter.ALL];
  public static readonly SORTS: readonly FeatureWishListSort[] = [FeatureWishListSort.NEWEST, FeatureWishListSort.OLDEST, FeatureWishListSort.MOST_LIKES];
  public static readonly PROGRESSES: readonly FeatureWishProgress[] = [FeatureWishProgress.COLLECTED, FeatureWishProgress.PLANNED, FeatureWishProgress.IN_PROGRESS, FeatureWishProgress.RELEASED, FeatureWishProgress.NOT_PLANNED];
  /** The statuses support can set by hand; `merged` needs an original and has its own action. */
  public static readonly SELECTABLE_STATUSES: readonly FeatureWishStatus[] = [FeatureWishStatus.DRAFT, FeatureWishStatus.PUBLISHED, FeatureWishStatus.ARCHIVED];
  /** How many published wishes the "duplicate of" selection offers. */
  public static readonly MERGE_TARGET_LIMIT = 300;

  /** Fields of the list and the details page. */
  public static readonly LIST_FIELDS: readonly string[] = ['id', 'title', 'description', 'status', 'progress', 'likes_amount', 'moderation_note_public', 'moderation_note_intern', 'date_created', 'date_updated', 'related_to.id', 'related_to.title', 'related_to.status', ...ProfileDetailsHelper.relatedFields('profile', [...ProfileDetailsHelper.LIST_FIELDS, 'language']), 'chat.id', 'chat.conversation_state', 'chat.date_updated'];

  static readonly FEATURE_WISHES_ENDPOINT = `/items/${CollectionNames.FEATURE_WHISHES}`;

  /** The Directus filter of a status chip; likes are always left out. */
  static buildStatusFilter(filter: FeatureWishListFilter): DirectusFilter {
    switch (filter) {
      case FeatureWishListFilter.IN_REVIEW:
        return { status: { _in: [...FeatureWishHelper.IN_REVIEW_STATUSES] } };
      case FeatureWishListFilter.PUBLISHED:
        return { status: { _eq: FeatureWishStatus.PUBLISHED } };
      case FeatureWishListFilter.MERGED:
        return { status: { _eq: FeatureWishStatus.MERGED } };
      case FeatureWishListFilter.ARCHIVED:
        return { status: { _eq: FeatureWishStatus.ARCHIVED } };
      case FeatureWishListFilter.ALL:
        return { status: { _neq: FeatureWishStatus.LIKE } };
    }
  }

  /** The known, ticked progresses in the order of the filter. */
  static getProgresses(progresses?: readonly unknown[] | null): FeatureWishProgress[] {
    const selected = Array.isArray(progresses) ? progresses : [];
    return FeatureWishModuleHelper.PROGRESSES.filter(progress => selected.includes(progress));
  }

  /** The Directus filter of the ticked progresses, `undefined` for none or all ticked. */
  static buildProgressFilter(progresses?: readonly FeatureWishProgress[] | null): DirectusFilter | undefined {
    const selected = FeatureWishModuleHelper.getProgresses(progresses);
    if (selected.length === 0 || selected.length === FeatureWishModuleHelper.PROGRESSES.length) {
      return undefined;
    }
    return { progress: { _in: selected } };
  }

  /** The status filter combined with the progresses of the options. */
  static buildFilter(filter: FeatureWishListFilter, options: FeatureWishListOptions = {}): DirectusFilter {
    const statusFilter = FeatureWishModuleHelper.buildStatusFilter(filter);
    const progressFilter = FeatureWishModuleHelper.buildProgressFilter(options.progresses);
    return progressFilter ? { _and: [statusFilter, progressFilter] } : statusFilter;
  }

  /** The Directus `sort` of an order; ties are broken by date, newest first. */
  static getSortParameter(sort?: FeatureWishListSort | null): string {
    switch (sort) {
      case FeatureWishListSort.OLDEST:
        return 'date_created';
      case FeatureWishListSort.MOST_LIKES:
        return '-likes_amount,-date_created';
      default:
        return '-date_created';
    }
  }

  /** URL parameters of the list request. */
  static buildListQuery(filter: FeatureWishListFilter, page: number, search?: string | null, options: FeatureWishListOptions = {}) {
    const query: Record<string, string | number> = {
      fields: FeatureWishModuleHelper.LIST_FIELDS.join(','),
      filter: JSON.stringify(FeatureWishModuleHelper.buildFilter(filter, options)),
      sort: FeatureWishModuleHelper.getSortParameter(options.sort),
      limit: FoodFeedbackChatHelper.getPageSize(options.pageSize),
      page: Math.max(1, page),
      meta: 'filter_count',
    };
    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      query.search = trimmedSearch;
    }
    return query;
  }

  /** URL parameters to count the wishes of one chip – with the same progresses and search as the list. */
  static buildCountQuery(filter: FeatureWishListFilter, options: FeatureWishListOptions = {}, search?: string | null) {
    const query: Record<string, string> = {
      aggregate: JSON.stringify({ count: ['id'] }),
      filter: JSON.stringify(FeatureWishModuleHelper.buildFilter(filter, options)),
    };
    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      query.search = trimmedSearch;
    }
    return query;
  }

  /** The duplicates merged into a wish, newest first. */
  static buildDuplicatesQuery(wishId: string) {
    return {
      fields: FeatureWishModuleHelper.LIST_FIELDS.join(','),
      filter: JSON.stringify({ _and: [{ related_to: { _eq: wishId } }, { status: { _eq: FeatureWishStatus.MERGED } }] }),
      sort: '-date_created',
      limit: -1,
    };
  }

  /** The published wishes a wish can be merged into, by title – never the wish itself. */
  static buildMergeTargetsQuery(excludeId?: string | null) {
    const parts: DirectusFilter[] = [{ status: { _eq: FeatureWishStatus.PUBLISHED } }];
    if (excludeId) {
      parts.push({ id: { _neq: excludeId } });
    }
    return {
      fields: 'id,title,likes_amount',
      filter: JSON.stringify(parts.length === 1 ? parts[0] : { _and: parts }),
      sort: 'title',
      limit: FeatureWishModuleHelper.MERGE_TARGET_LIMIT,
    };
  }

  static getFilterLabelKey(filter: FeatureWishListFilter): BackendTranslationKeys {
    switch (filter) {
      case FeatureWishListFilter.IN_REVIEW:
        return BackendTranslationKeys.rocket_meals_module_feature_wish_filter_in_review;
      case FeatureWishListFilter.PUBLISHED:
        return BackendTranslationKeys.rocket_meals_module_feature_wish_status_published;
      case FeatureWishListFilter.MERGED:
        return BackendTranslationKeys.rocket_meals_module_feature_wish_status_merged;
      case FeatureWishListFilter.ARCHIVED:
        return BackendTranslationKeys.rocket_meals_module_feature_wish_status_archived;
      case FeatureWishListFilter.ALL:
        return BackendTranslationKeys.rocket_meals_module_filter_all;
    }
  }

  static getSortLabelKey(sort: FeatureWishListSort): BackendTranslationKeys {
    switch (sort) {
      case FeatureWishListSort.OLDEST:
        return BackendTranslationKeys.rocket_meals_module_sort_oldest;
      case FeatureWishListSort.MOST_LIKES:
        return BackendTranslationKeys.rocket_meals_module_feature_wish_sort_most_likes;
      default:
        return BackendTranslationKeys.rocket_meals_module_sort_newest;
    }
  }

  static getSortIcon(sort: FeatureWishListSort): string {
    switch (sort) {
      case FeatureWishListSort.OLDEST:
        return 'history';
      case FeatureWishListSort.MOST_LIKES:
        return 'thumb_up';
      default:
        return 'schedule';
    }
  }

  /** Label, icon and colour of a status. An unknown status is shown like a draft. */
  static getStatusPresentation(status: string | null | undefined): FeatureWishPresentation {
    switch (status) {
      case FeatureWishStatus.AI_SUGGESTS_PUBLISH:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_status_ai_suggests_publish, icon: 'robot_2', color: 'var(--theme--success)' };
      case FeatureWishStatus.AI_SUGGESTS_DECLINE:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_status_ai_suggests_decline, icon: 'robot_2', color: 'var(--theme--danger)' };
      case FeatureWishStatus.AI_SUGGESTS_MERGE:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_status_ai_suggests_merge, icon: 'content_copy', color: 'var(--theme--warning)' };
      case FeatureWishStatus.PUBLISHED:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_status_published, icon: 'public', color: 'var(--theme--primary)' };
      case FeatureWishStatus.MERGED:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_status_merged, icon: 'merge', color: 'var(--theme--foreground-subdued)' };
      case FeatureWishStatus.ARCHIVED:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_status_archived, icon: 'archive', color: 'var(--theme--foreground-subdued)' };
      default:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_status_draft, icon: 'fiber_new', color: 'var(--theme--warning)' };
    }
  }

  /** Label, icon and colour of a progress; `undefined` when none is set. */
  static getProgressPresentation(progress: string | null | undefined): FeatureWishPresentation | undefined {
    switch (progress) {
      case FeatureWishProgress.COLLECTED:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_progress_collected, icon: 'forward_to_inbox', color: 'var(--theme--foreground-subdued)' };
      case FeatureWishProgress.PLANNED:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_progress_planned, icon: 'flag', color: 'var(--theme--warning)' };
      case FeatureWishProgress.IN_PROGRESS:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_progress_in_progress, icon: 'construction', color: 'var(--theme--primary)' };
      case FeatureWishProgress.RELEASED:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_progress_released, icon: 'rocket_launch', color: 'var(--theme--success)' };
      case FeatureWishProgress.NOT_PLANNED:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_progress_not_planned, icon: 'block', color: 'var(--theme--danger)' };
      default:
        return undefined;
    }
  }

  /** The AI suggestion of a wish in review, `undefined` for a draft or a decided wish. */
  static getSuggestion(wish: Pick<FeatureWishListItem, 'status'>): FeatureWishSuggestion | undefined {
    switch (wish.status) {
      case FeatureWishStatus.AI_SUGGESTS_PUBLISH:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_publish, icon: 'public', acceptStatus: FeatureWishStatus.PUBLISHED };
      case FeatureWishStatus.AI_SUGGESTS_DECLINE:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_archive, icon: 'archive', acceptStatus: FeatureWishStatus.ARCHIVED };
      case FeatureWishStatus.AI_SUGGESTS_MERGE:
        return { labelKey: BackendTranslationKeys.rocket_meals_module_feature_wish_merge, icon: 'merge', acceptStatus: FeatureWishStatus.MERGED };
      default:
        return undefined;
    }
  }

  /** Whether the suggestion can be taken over as it is – a merge needs the original it points to. */
  static canAcceptSuggestion(wish: Pick<FeatureWishListItem, 'status' | 'related_to'>): boolean {
    const suggestion = FeatureWishModuleHelper.getSuggestion(wish);
    if (!suggestion) {
      return false;
    }
    return suggestion.acceptStatus !== FeatureWishStatus.MERGED || !!FeatureWishModuleHelper.getRelatedToId(wish);
  }

  static isInReview(wish: Pick<FeatureWishListItem, 'status'>): boolean {
    return FeatureWishHelper.isInReview(wish);
  }

  static canPublish(wish: Pick<FeatureWishListItem, 'status'>): boolean {
    return wish.status !== FeatureWishStatus.PUBLISHED && wish.status !== FeatureWishStatus.LIKE;
  }

  static canArchive(wish: Pick<FeatureWishListItem, 'status'>): boolean {
    return wish.status !== FeatureWishStatus.ARCHIVED && wish.status !== FeatureWishStatus.LIKE;
  }

  static getRelatedToId(wish: Pick<FeatureWishListItem, 'related_to'>): string | undefined {
    return FeatureWishHelper.getRelatedToId(wish) ?? undefined;
  }

  /** The title of the original a wish is (or should be) merged into, `undefined` when it is not loaded. */
  static getRelatedToTitle(wish: Pick<FeatureWishListItem, 'related_to'>): string | undefined {
    const relatedTo = wish.related_to;
    if (!relatedTo || typeof relatedTo === 'string') {
      return undefined;
    }
    return relatedTo.title?.trim() || undefined;
  }

  static getTitle(wish: Pick<FeatureWishListItem, 'title'>): string | undefined {
    return wish.title?.trim() || undefined;
  }

  static getDescription(wish: Pick<FeatureWishListItem, 'description'>): string {
    return wish.description?.trim() ?? '';
  }

  /** The author counts as the first like, so a wish never has less than one. */
  static getLikes(wish: Pick<FeatureWishListItem, 'likes_amount'>): number {
    const likes = Number(wish.likes_amount);
    return Number.isFinite(likes) && likes > 0 ? likes : FeatureWishHelper.AUTHOR_LIKES;
  }

  /** Support can write to the author only when the wish has a profile (or a chat already). */
  static canChat(wish: Pick<FeatureWishListItem, 'profile' | 'chat'>): boolean {
    return !!RelationHelper.getId(wish.chat) || !!RelationHelper.getId(wish.profile);
  }

  static getProfile(wish: Pick<FeatureWishListItem, 'profile'>): ModuleProfile | undefined {
    return ProfileDetailsHelper.getProfile(wish.profile);
  }
}
