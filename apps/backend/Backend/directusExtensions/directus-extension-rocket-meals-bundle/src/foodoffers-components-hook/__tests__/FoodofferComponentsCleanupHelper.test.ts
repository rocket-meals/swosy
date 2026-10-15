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
  type Candidate = { id: string; date_created: string };

  // Applies the keyset filter (date_created > cursor, or same date_created and id not seen yet) and the limit
  function isAfterCursor(candidate: Candidate, cursorCondition: any): boolean {
    if (!cursorCondition) {
      return true;
    }
    const [greater, same] = cursorCondition._or;
    if (candidate.date_created > greater.date_created._gt) {
      return true;
    }
    const [sameDate, notSeen] = same._and;
    return candidate.date_created === sameDate.date_created._eq && !notSeen.id._nin.includes(candidate.id);
  }

  // Candidate foodoffers sorted by date_created and id
  function createCleanupDatabaseHelper(candidates: Candidate[], junctionRows: JunctionRow[]) {
    const remaining = [...candidates].sort((a, b) => a.date_created.localeCompare(b.date_created) || a.id.localeCompare(b.id));
    const candidateQueries: any[] = [];
    const deleteCalls: string[][] = [];
    const helper = {
      getFoodoffersHelper: () => ({
        readByQuery: async (query: any) => {
          candidateQueries.push(query);
          const cursorCondition = query.filter._and.find((condition: any) => condition._or);
          return remaining.filter(candidate => isAfterCursor(candidate, cursorCondition)).slice(0, query.limit);
        },
        deleteMany: async (ids: string[]) => {
          deleteCalls.push(ids);
          for (const id of ids) {
            remaining.splice(
              remaining.findIndex(candidate => candidate.id === id),
              1
            );
          }
        },
      }),
      getFoodofferComponentsHelper: () => ({
        readByQuery: async (query: any) => junctionRows.filter(row => matches(row, query.filter)),
      }),
    } as unknown as MyDatabaseHelper;
    return { helper, candidateQueries, deleteCalls };
  }

  async function runCleanup(candidates: Candidate[]) {
    // Every third candidate is still linked to a parent and has to stay
    const junctionRows: JunctionRow[] = candidates.filter((_, index) => index % 3 === 0).map((candidate, index) => ({ id: index, parent_foodoffers_id: 'parent', component_foodoffers_id: candidate.id }));
    const { helper, candidateQueries, deleteCalls } = createCleanupDatabaseHelper(candidates, junctionRows);
    const deleted = await FoodofferComponentsCleanupHelper.deleteOrphanedComponentFoodoffers(helper, async () => {});
    const linkedIds = new Set(junctionRows.map(row => row.component_foodoffers_id));
    const expectedDeleted = candidates.map(candidate => candidate.id).filter(id => !linkedIds.has(id));
    return { deleted, deleteCalls, candidateQueries, expectedDeleted };
  }

  it('walks all pages via the last row of the previous page and deletes only the orphans', async () => {
    const batchSize = FoodofferComponentsCleanupHelper.DELETE_BATCH_SIZE;
    const candidates = Array.from({ length: batchSize * 2 + 5 }, (_, index) => ({ id: 'c-' + String(index).padStart(6, '0'), date_created: new Date(Date.UTC(2026, 0, 1) + index * 1000).toISOString() }));
    const { deleted, deleteCalls, candidateQueries, expectedDeleted } = await runCleanup(candidates);

    expect(deleted).toBe(expectedDeleted.length);
    expect(deleteCalls.flat().sort()).toEqual(expectedDeleted);
    expect(candidateQueries).toHaveLength(3);
    expect(candidateQueries[0].offset).toBeUndefined();
    expect(candidateQueries[1].filter._and).toContainEqual({ _or: [{ date_created: { _gt: candidates[batchSize - 1]!.date_created } }, { _and: [{ date_created: { _eq: candidates[batchSize - 1]!.date_created } }, { id: { _nin: [candidates[batchSize - 1]!.id] } }] }] });
  });

  it('never filters the uuid id with _gt, which Directus rejects', async () => {
    const batchSize = FoodofferComponentsCleanupHelper.DELETE_BATCH_SIZE;
    const candidates = Array.from({ length: batchSize + 5 }, (_, index) => ({ id: 'c-' + String(index).padStart(6, '0'), date_created: new Date(Date.UTC(2026, 0, 1) + index).toISOString() }));
    const { candidateQueries } = await runCleanup(candidates);
    expect(JSON.stringify(candidateQueries)).not.toMatch(/"id":\{"_gt"/);
  });

  it('pages through more rows than one page holding the same date_created', async () => {
    const batchSize = FoodofferComponentsCleanupHelper.DELETE_BATCH_SIZE;
    const sameDate = new Date(Date.UTC(2026, 0, 1)).toISOString();
    const laterDate = new Date(Date.UTC(2026, 0, 2)).toISOString();
    const candidates = Array.from({ length: batchSize * 2 + 5 }, (_, index) => ({ id: 'c-' + String(index).padStart(6, '0'), date_created: index < batchSize * 2 ? sameDate : laterDate }));
    const { deleted, deleteCalls, candidateQueries, expectedDeleted } = await runCleanup(candidates);

    expect(deleted).toBe(expectedDeleted.length);
    expect(deleteCalls.flat().sort()).toEqual(expectedDeleted);
    expect(candidateQueries).toHaveLength(3);
  });
});
