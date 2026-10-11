/**
 * ModuleListHelper.ts – what every paginated list page of the module `Rocket Meals` shares: page
 * size and page count, the URL parameters of the list and count requests, reading the count of an
 * `aggregate` answer and the list settings remembered per browser.
 *
 * Plain logic without Vue or Directus app imports, so it can be unit tested in Node.
 */

export type ModuleListQuery = Record<string, string | number>;

export type ModuleListQueryOptions = {
  fields: readonly string[];
  /** A Directus filter object, sent as JSON. */
  filter: unknown;
  sort: string;
  page: number;
  pageSize?: number | null;
  search?: string | null;
};

export type ModuleCountQueryOptions = Pick<ModuleListQueryOptions, 'filter' | 'search'>;

/** What a list page with status chips counts: the chip, the search text and the further options of the list. */
export type ModuleStatusCountRequest<TFilter, TOptions> = {
  filter: TFilter;
  search?: string | null;
  options?: TOptions;
};

/** What a list page with status chips loads: like the count, plus the page. */
export type ModuleStatusListRequest<TFilter, TOptions> = ModuleStatusCountRequest<TFilter, TOptions> & {
  page: number;
};

/** The part of `window.localStorage` the list settings need – replaceable in tests. */
export type ModuleListSettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;

export class ModuleListHelper {
  public static readonly PAGE_SIZE = 25;
  public static readonly PAGE_SIZE_OPTIONS: readonly number[] = [10, 25, 50, 100];
  /** How long typing in a search field waits before the list loads. */
  public static readonly SEARCH_DEBOUNCE_MS = 300;

  /** A page size from the offered options, else the default. */
  static getPageSize(pageSize?: number | null): number {
    return pageSize && ModuleListHelper.PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : ModuleListHelper.PAGE_SIZE;
  }

  static getPageCount(total: number, pageSize?: number | null): number {
    return Math.max(1, Math.ceil(total / ModuleListHelper.getPageSize(pageSize)));
  }

  /** The items of the page size dropdown. */
  static getPageSizeItems(): { text: string; value: number }[] {
    return ModuleListHelper.PAGE_SIZE_OPTIONS.map(size => ({ text: String(size), value: size }));
  }

  /** URL parameters of a list request with the total of all matching items (`filter_count`). */
  static buildListQuery(options: ModuleListQueryOptions): ModuleListQuery {
    const query: ModuleListQuery = {
      fields: options.fields.join(','),
      filter: JSON.stringify(options.filter),
      sort: options.sort,
      limit: ModuleListHelper.getPageSize(options.pageSize),
      page: Math.max(1, options.page),
      meta: 'filter_count',
    };
    return ModuleListHelper.withSearch(query, options.search);
  }

  /** URL parameters to count the items of one filter chip – with the same filter and search as the list. */
  static buildCountQuery(options: ModuleCountQueryOptions): Record<string, string> {
    const query: Record<string, string> = {
      aggregate: JSON.stringify({ count: ['id'] }),
      filter: JSON.stringify(options.filter),
    };
    return ModuleListHelper.withSearch(query, options.search);
  }

  /** The count of an answer to `buildCountQuery`. */
  static readCount(body: unknown): number {
    const data = (body as { data?: { count?: { id?: unknown } }[] } | null | undefined)?.data;
    return Number(data?.[0]?.count?.id ?? 0);
  }

  /** The key the settings of a list are remembered under, e.g. `rocket-meals-module.food-feedbacks.list-settings`. */
  static getSettingsStorageKey(listId: string): string {
    return `rocket-meals-module.${listId}.list-settings`;
  }

  /** The remembered settings of a list, or nothing when there are none or storage is unavailable (private mode, blocked). */
  static readSettings<T extends object>(storage: ModuleListSettingsStorage | undefined, key: string): Partial<T> {
    try {
      const raw = storage?.getItem(key);
      const parsed: unknown = raw ? JSON.parse(raw) : undefined;
      return parsed && typeof parsed === 'object' ? (parsed as Partial<T>) : {};
    } catch {
      return {};
    }
  }

  /** Remembers the settings of a list. Without storage they just are not remembered. */
  static storeSettings(storage: ModuleListSettingsStorage | undefined, key: string, settings: object): void {
    try {
      storage?.setItem(key, JSON.stringify(settings));
    } catch {
      // Storage unavailable (private mode, blocked) – the settings just are not remembered.
    }
  }

  /** A remembered value when it is one of the allowed ones, else the fallback. */
  static pickAllowed<T>(value: unknown, allowed: readonly T[], fallback: T): T {
    return allowed.includes(value as T) ? (value as T) : fallback;
  }

  private static withSearch<T extends Record<string, string | number>>(query: T, search?: string | null): T {
    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      (query as Record<string, string | number>).search = trimmedSearch;
    }
    return query;
  }
}
