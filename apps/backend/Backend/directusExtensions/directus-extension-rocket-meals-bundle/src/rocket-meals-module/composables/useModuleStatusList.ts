/**
 * Vue composable for the paginated list pages of the module `Rocket Meals` (food feedbacks, app
 * feedbacks, feature wishes): status chips with counts, a search, list options like filters, sort
 * and page size, pages, and items that can be selected and updated one by one or several at once.
 * Only usable inside a component `setup`.
 *
 * - Answers of an older request that arrive late never replace those of a newer one.
 * - A change of the search (debounced) or the options starts again on page 1 and counts anew.
 *   Switching the status chip or the page only loads the list.
 * - The ids being updated are tracked, so an item is never sent twice and its buttons show a spinner.
 */

import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref, type WatchSource } from 'vue';
import { ModuleListHelper, type ModuleListQuery, type ModuleStatusCountRequest, type ModuleStatusListRequest } from '../../helpers/rocket-meals-module/ModuleListHelper';
import type { BackendTranslationKeys } from '../../helpers/translations/BackendTranslationKeys';
import { useAppExtensionTranslate } from '../../helpers/app-extensions/useAppExtensionTranslate';

export type ModuleListItem = { id: string };

export type ModuleStatusListConfig<TItem extends ModuleListItem, TFilter extends string, TOptions extends { pageSize?: number | null }> = {
  /** Used in error logs, e.g. `food feedbacks`. */
  name: string;
  endpoint: string;
  filters: readonly TFilter[];
  initialFilter: TFilter;
  /** Everything besides status, page and search that the requests depend on; a change starts again on page 1. */
  options: Readonly<Ref<TOptions>>;
  buildListQuery: (request: ModuleStatusListRequest<TFilter, TOptions>) => ModuleListQuery;
  buildCountQuery: (request: ModuleStatusCountRequest<TFilter, TOptions>) => Record<string, string>;
  /** Only these items can be selected; all when not given. */
  canSelect?: (item: TItem) => boolean;
};

/** A copy of `source` that follows it only after typing paused. */
export function useDebouncedRef<T>(source: WatchSource<T>, initial: T, delayMs: number = ModuleListHelper.SEARCH_DEBOUNCE_MS): Readonly<Ref<T>> {
  const debounced = ref(initial) as Ref<T>;
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(source, value => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      debounced.value = value;
    }, delayMs);
  });
  onBeforeUnmount(() => clearTimeout(timer));
  return debounced;
}

export function useModuleStatusList<TItem extends ModuleListItem, TFilter extends string, TOptions extends { pageSize?: number | null }>(config: ModuleStatusListConfig<TItem, TFilter, TOptions>) {
  const api = useApi();
  const { useNotificationsStore } = useStores();
  const notificationsStore = useNotificationsStore();
  const { translate } = useAppExtensionTranslate();

  const activeFilter = ref(config.initialFilter) as Ref<TFilter>;
  const search = ref('');
  const searchQuery = useDebouncedRef(search, '');
  const currentPage = ref(1);
  const items = ref<TItem[]>([]) as Ref<TItem[]>;
  const total = ref(0);
  const counts = ref<Partial<Record<TFilter, number>>>({}) as Ref<Partial<Record<TFilter, number>>>;
  const loading = ref(false);
  const loadError = ref(false);
  const selectedIds = ref<string[]>([]);
  const updatingIds = ref<string[]>([]);

  const pageCount = computed(() => ModuleListHelper.getPageCount(total.value, config.options.value.pageSize));
  const pageSizeItems = ModuleListHelper.getPageSizeItems();

  const canSelect = (item: TItem) => config.canSelect?.(item) ?? true;
  const selectableItems = computed(() => items.value.filter(canSelect));
  const selectedItems = computed(() => selectableItems.value.filter(item => selectedIds.value.includes(item.id)));
  const allSelected = computed(() => selectableItems.value.length > 0 && selectedItems.value.length === selectableItems.value.length);
  const someSelected = computed(() => selectedItems.value.length > 0 && !allSelected.value);

  let latestRequest = 0;

  async function loadItems() {
    const request = ++latestRequest;
    loading.value = true;
    try {
      const response = await api.get(config.endpoint, {
        params: config.buildListQuery({ filter: activeFilter.value, page: currentPage.value, search: searchQuery.value, options: config.options.value }),
      });
      if (request === latestRequest) {
        items.value = response.data?.data ?? [];
        total.value = response.data?.meta?.filter_count ?? items.value.length;
        loadError.value = false;
        // Keep only selections that are still visible and selectable.
        selectedIds.value = selectedIds.value.filter(id => selectableItems.value.some(item => item.id === id));
      }
    } catch (error) {
      console.error(`[rocket-meals-module] loading ${config.name} failed`, error);
      if (request === latestRequest) {
        items.value = [];
        loadError.value = true;
      }
    } finally {
      if (request === latestRequest) {
        loading.value = false;
      }
    }
  }

  let latestCountRequest = 0;

  async function loadCounts() {
    const request = ++latestCountRequest;
    const entries = await Promise.all(
      config.filters.map(async filter => {
        try {
          const response = await api.get(config.endpoint, { params: config.buildCountQuery({ filter, search: searchQuery.value, options: config.options.value }) });
          return [filter, ModuleListHelper.readCount(response.data)] as const;
        } catch {
          return [filter, undefined] as const;
        }
      })
    );
    if (request === latestCountRequest) {
      counts.value = Object.fromEntries(entries.filter(([, count]) => count !== undefined)) as Partial<Record<TFilter, number>>;
    }
  }

  function reload() {
    void loadItems();
    void loadCounts();
  }

  /** After a change of the search or the options: back to page 1 – the page watcher then loads the list. */
  function reloadFromFirstPage() {
    if (currentPage.value === 1) {
      reload();
    } else {
      currentPage.value = 1;
      void loadCounts();
    }
  }

  function selectFilter(filter: TFilter) {
    activeFilter.value = filter;
    currentPage.value = 1;
  }

  function isSelected(item: TItem) {
    return selectedIds.value.includes(item.id);
  }

  function toggleSelected(item: TItem, selected: boolean) {
    const others = selectedIds.value.filter(id => id !== item.id);
    selectedIds.value = selected ? [...others, item.id] : others;
  }

  function toggleSelectAll(selected: boolean) {
    selectedIds.value = selected ? selectableItems.value.map(item => item.id) : [];
  }

  function isUpdating(item: TItem) {
    return updatingIds.value.includes(item.id);
  }

  /**
   * Runs an update on the items that are not being updated already, then reloads the list. Items
   * that were updated leave the selection; when some failed, `failedTitleKey` is shown.
   */
  async function runUpdate<TPending extends TItem>(itemsToUpdate: readonly TPending[], update: (pending: TPending[]) => Promise<{ failedIds: string[] }>, failedTitleKey: BackendTranslationKeys) {
    const pending = itemsToUpdate.filter(item => !isUpdating(item));
    if (pending.length === 0) {
      return;
    }
    const pendingIds = pending.map(item => item.id);
    updatingIds.value = [...updatingIds.value, ...pendingIds];
    try {
      const result = await update(pending);
      selectedIds.value = selectedIds.value.filter(id => !pendingIds.includes(id) || result.failedIds.includes(id));
      if (result.failedIds.length > 0) {
        notificationsStore.add({ title: translate(failedTitleKey), type: 'error' });
      }
    } finally {
      updatingIds.value = updatingIds.value.filter(id => !pendingIds.includes(id));
      reload();
    }
  }

  watch([searchQuery, config.options], reloadFromFirstPage);
  watch([activeFilter, currentPage], loadItems);
  onMounted(reload);

  return {
    activeFilter,
    search,
    currentPage,
    items,
    total,
    counts,
    loading,
    loadError,
    pageCount,
    pageSizeItems,
    reload,
    selectFilter,
    selectableItems,
    selectedItems,
    allSelected,
    someSelected,
    isSelected,
    toggleSelected,
    toggleSelectAll,
    isUpdating,
    runUpdate,
  };
}
