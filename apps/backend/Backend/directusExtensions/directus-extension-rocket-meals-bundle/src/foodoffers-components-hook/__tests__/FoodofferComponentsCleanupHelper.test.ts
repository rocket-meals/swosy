import { describe, expect, it } from '@jest/globals';
import { FoodofferComponentsCleanupHelper } from '../FoodofferComponentsCleanupHelper';
import { MyDatabaseHelper } from '../../helpers/MyDatabaseHelper';

type JunctionRow = { id: number; parent_foodoffers_id: string | null; component_foodoffers_id: string | null };

// Evaluates the small subset of Directus filters the helper uses (_and, _or, _in, _nin) against in-memory rows.
function matches(row: any, filter: any): boolean {
  return Object.entries(filter).every(([key, condition]: [string, any]) => {
    if (key === '_and') {
      return condition.every((part: any) => matches(row, part));
    }
    if (key === '_or') {
      return condition.some((part: any) => matches(row, part));
    }
    const value = row[key];
    if (condition._in) {
      return condition._in.map(String).includes(String(value));
    }
    if (condition._nin) {
      // SQL NOT IN: rows with NULL never match
      return value !== null && !condition._nin.map(String).includes(String(value));
    }
    throw new Error('unsupported filter ' + JSON.stringify(condition));
  });
}

function createDatabaseHelper(rows: JunctionRow[]) {
  const queries: any[] = [];
  const helper = {
    getFoodofferComponentsHelper: () => ({
      readByQuery: async (query: any) => {
        queries.push(query);
        return rows.filter(row => matches(row, query.filter));
      },
    }),
  } as unknown as MyDatabaseHelper;
  return { helper, queries };
}

describe('FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents', () => {
  it('returns the components of the deleted parents', async () => {
    const { helper } = createDatabaseHelper([
      { id: 1, parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'component-1a' },
      { id: 2, parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'component-1b' },
      { id: 3, parent_foodoffers_id: 'parent-2', component_foodoffers_id: 'component-2a' },
    ]);
    expect(await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents(helper, ['parent-1'])).toEqual(['component-1a', 'component-1b']);
  });

  it('keeps a component that another parent still uses', async () => {
    const { helper } = createDatabaseHelper([
      { id: 1, parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'shared-component' },
      { id: 2, parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'own-component' },
      { id: 3, parent_foodoffers_id: 'parent-2', component_foodoffers_id: 'shared-component' },
    ]);
    expect(await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents(helper, ['parent-1'])).toEqual(['own-component']);
  });

  it('deletes a shared component when all parents using it are deleted together', async () => {
    const { helper } = createDatabaseHelper([
      { id: 1, parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'shared-component' },
      { id: 2, parent_foodoffers_id: 'parent-2', component_foodoffers_id: 'shared-component' },
    ]);
    expect(await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents(helper, ['parent-1', 'parent-2'])).toEqual(['shared-component']);
  });

  it('does not return ids that are deleted anyway, nor duplicates or empty references', async () => {
    const { helper } = createDatabaseHelper([
      { id: 1, parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'component-1a' },
      { id: 2, parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'component-1a' },
      { id: 3, parent_foodoffers_id: 'parent-1', component_foodoffers_id: null },
      { id: 4, parent_foodoffers_id: 'parent-2', component_foodoffers_id: 'parent-1' },
    ]);
    expect(await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents(helper, ['parent-1', 'parent-2'])).toEqual(['component-1a']);
  });

  it('does not query the database for a delete without parents', async () => {
    const { helper, queries } = createDatabaseHelper([]);
    expect(await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents(helper, [])).toEqual([]);
    expect(queries).toHaveLength(0);
  });
});

describe('FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfJunctionRows', () => {
  it('returns the component of a deselected junction row', async () => {
    const { helper } = createDatabaseHelper([
      { id: 1, parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'component-1a' },
      { id: 2, parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'component-1b' },
    ]);
    expect(await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfJunctionRows(helper, [1])).toEqual(['component-1a']);
  });

  it('keeps a component that another junction row still uses', async () => {
    const { helper } = createDatabaseHelper([
      { id: 1, parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'shared-component' },
      { id: 2, parent_foodoffers_id: 'parent-2', component_foodoffers_id: 'shared-component' },
    ]);
    expect(await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfJunctionRows(helper, [1])).toEqual([]);
    expect(await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfJunctionRows(helper, [1, 2])).toEqual(['shared-component']);
  });
});

describe('FoodofferComponentsCleanupHelper.filterUnreferencedIds', () => {
  it('keeps only candidates that are neither a linked component nor a parent', async () => {
    const { helper } = createDatabaseHelper([
      { id: 1, parent_foodoffers_id: 'dish-1', component_foodoffers_id: 'linked-component' },
      { id: 2, parent_foodoffers_id: 'parent-without-canteen', component_foodoffers_id: 'other-component' },
    ]);
    const candidates = ['linked-component', 'parent-without-canteen', 'orphan-1', 'orphan-2'];
    expect(await FoodofferComponentsCleanupHelper.filterUnreferencedIds(helper, candidates)).toEqual(['orphan-1', 'orphan-2']);
  });

  it('does not query the database without candidates', async () => {
    const { helper, queries } = createDatabaseHelper([]);
    expect(await FoodofferComponentsCleanupHelper.filterUnreferencedIds(helper, [])).toEqual([]);
    expect(queries).toHaveLength(0);
  });
});

describe('FoodofferComponentsCleanupHelper.deleteOrphanedComponentFoodoffers', () => {
  // Candidate foodoffers sorted by id; the foodoffers helper applies the keyset filter (id > afterId) and the limit
  function createCleanupDatabaseHelper(candidateIds: string[], junctionRows: JunctionRow[]) {
    const remainingIds = [...candidateIds].sort();
    const candidateQueries: any[] = [];
    const deleteCalls: string[][] = [];
    const helper = {
      getFoodoffersHelper: () => ({
        readByQuery: async (query: any) => {
          candidateQueries.push(query);
          const afterCondition = query.filter._and.find((condition: any) => condition.id);
          const afterId: string | null = afterCondition ? afterCondition.id._gt : null;
          return remainingIds
            .filter(id => afterId === null || id > afterId)
            .slice(0, query.limit)
            .map(id => ({ id }));
        },
        deleteMany: async (ids: string[]) => {
          deleteCalls.push(ids);
          for (const id of ids) {
            remainingIds.splice(remainingIds.indexOf(id), 1);
          }
        },
      }),
      getFoodofferComponentsHelper: () => ({
        readByQuery: async (query: any) => junctionRows.filter(row => matches(row, query.filter)),
      }),
    } as unknown as MyDatabaseHelper;
    return { helper, candidateQueries, deleteCalls };
  }

  it('walks all pages via the last id of the previous page and deletes only the orphans', async () => {
    const batchSize = FoodofferComponentsCleanupHelper.DELETE_BATCH_SIZE;
    const candidateIds = Array.from({ length: batchSize * 2 + 5 }, (_, index) => 'c-' + String(index).padStart(6, '0'));
    // Every third candidate is still linked to a parent and has to stay
    const junctionRows: JunctionRow[] = candidateIds.filter((_, index) => index % 3 === 0).map((id, index) => ({ id: index, parent_foodoffers_id: 'parent', component_foodoffers_id: id }));
    const { helper, candidateQueries, deleteCalls } = createCleanupDatabaseHelper(candidateIds, junctionRows);

    const deleted = await FoodofferComponentsCleanupHelper.deleteOrphanedComponentFoodoffers(helper, async () => {});

    const linkedIds = new Set(junctionRows.map(row => row.component_foodoffers_id));
    const expectedDeleted = candidateIds.filter(id => !linkedIds.has(id));
    expect(deleted).toBe(expectedDeleted.length);
    expect(deleteCalls.flat().sort()).toEqual(expectedDeleted);
    expect(candidateQueries).toHaveLength(3);
    expect(candidateQueries[0].offset).toBeUndefined();
    expect(candidateQueries[1].filter._and).toContainEqual({ id: { _gt: candidateIds[batchSize - 1] } });
    expect(candidateQueries[2].filter._and).toContainEqual({ id: { _gt: candidateIds[batchSize * 2 - 1] } });
  });
});
