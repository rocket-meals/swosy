import { describe, expect, it } from '@jest/globals';
import { ModuleListHelper, type ModuleListSettingsStorage } from '../ModuleListHelper';

function createStorage(initial: Record<string, string> = {}): ModuleListSettingsStorage & { values: Record<string, string> } {
  const values = { ...initial };
  return {
    values,
    getItem: key => values[key] ?? null,
    setItem: (key, value) => {
      values[key] = value;
    },
  };
}

describe('ModuleListHelper', () => {
  it('counts pages', () => {
    expect(ModuleListHelper.getPageCount(0)).toBe(1);
    expect(ModuleListHelper.getPageCount(25)).toBe(1);
    expect(ModuleListHelper.getPageCount(26)).toBe(2);
    expect(ModuleListHelper.getPageCount(26, 10)).toBe(3);
  });

  it('only accepts offered page sizes', () => {
    expect(ModuleListHelper.getPageSize(50)).toBe(50);
    expect(ModuleListHelper.getPageSize(7)).toBe(ModuleListHelper.PAGE_SIZE);
    expect(ModuleListHelper.getPageSize(null)).toBe(ModuleListHelper.PAGE_SIZE);
    expect(ModuleListHelper.getPageSizeItems().map(item => item.value)).toEqual([...ModuleListHelper.PAGE_SIZE_OPTIONS]);
  });

  describe('buildListQuery', () => {
    it('pages, sorts, counts all matches and trims the search', () => {
      const query = ModuleListHelper.buildListQuery({ fields: ['id', 'chat.id'], filter: { id: { _eq: '1' } }, sort: '-date_created', page: 3, pageSize: 50, search: '  Pasta ' });
      expect(query).toEqual({ fields: 'id,chat.id', filter: JSON.stringify({ id: { _eq: '1' } }), sort: '-date_created', limit: 50, page: 3, meta: 'filter_count', search: 'Pasta' });
    });

    it('omits an empty search, clamps the page and falls back to the default page size', () => {
      const query = ModuleListHelper.buildListQuery({ fields: ['id'], filter: {}, sort: 'id', page: 0, pageSize: 7, search: '   ' });
      expect(query.search).toBeUndefined();
      expect(query.page).toBe(1);
      expect(query.limit).toBe(ModuleListHelper.PAGE_SIZE);
    });
  });

  it('builds the count query with the same filter and search', () => {
    expect(ModuleListHelper.buildCountQuery({ filter: { a: 1 }, search: ' x ' })).toEqual({ aggregate: JSON.stringify({ count: ['id'] }), filter: JSON.stringify({ a: 1 }), search: 'x' });
    expect(ModuleListHelper.buildCountQuery({ filter: { a: 1 } }).search).toBeUndefined();
  });

  it('reads the count of an aggregate answer', () => {
    expect(ModuleListHelper.readCount({ data: [{ count: { id: '12' } }] })).toBe(12);
    expect(ModuleListHelper.readCount({ data: [] })).toBe(0);
    expect(ModuleListHelper.readCount(undefined)).toBe(0);
  });

  describe('list settings', () => {
    const key = ModuleListHelper.getSettingsStorageKey('food-feedbacks');

    it('keeps the key of the existing pages', () => {
      expect(key).toBe('rocket-meals-module.food-feedbacks.list-settings');
    });

    it('stores and reads settings', () => {
      const storage = createStorage();
      ModuleListHelper.storeSettings(storage, key, { sort: 'newest', pageSize: 50 });
      expect(ModuleListHelper.readSettings<{ sort: string; pageSize: number }>(storage, key)).toEqual({ sort: 'newest', pageSize: 50 });
    });

    it('reads nothing from broken, foreign or missing storage', () => {
      expect(ModuleListHelper.readSettings(createStorage({ [key]: '{broken' }), key)).toEqual({});
      expect(ModuleListHelper.readSettings(createStorage({ [key]: '42' }), key)).toEqual({});
      expect(ModuleListHelper.readSettings(undefined, key)).toEqual({});
      const throwing: ModuleListSettingsStorage = {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('blocked');
        },
      };
      expect(ModuleListHelper.readSettings(throwing, key)).toEqual({});
      expect(() => ModuleListHelper.storeSettings(throwing, key, {})).not.toThrow();
    });
  });

  it('only takes allowed remembered values', () => {
    expect(ModuleListHelper.pickAllowed('b', ['a', 'b'], 'a')).toBe('b');
    expect(ModuleListHelper.pickAllowed('c', ['a', 'b'], 'a')).toBe('a');
    expect(ModuleListHelper.pickAllowed(undefined, ['a', 'b'], 'a')).toBe('a');
  });

  it('picks the allowed values of a remembered list in their order, else the fallback', () => {
    expect(ModuleListHelper.pickAllowedList(['c', 'b', 'a'], ['a', 'b'], ['a'])).toEqual(['a', 'b']);
    expect(ModuleListHelper.pickAllowedList([], ['a', 'b'], ['a'])).toEqual([]);
    expect(ModuleListHelper.pickAllowedList(undefined, ['a', 'b'], ['a'])).toEqual(['a']);
    expect(ModuleListHelper.pickAllowedList('a', ['a', 'b'], ['b'])).toEqual(['b']);
  });
});
