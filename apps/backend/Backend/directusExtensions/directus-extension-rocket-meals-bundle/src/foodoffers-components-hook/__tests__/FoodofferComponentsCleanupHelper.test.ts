import { describe, expect, it } from '@jest/globals';
import { FoodofferComponentsCleanupHelper } from '../FoodofferComponentsCleanupHelper';
import { MyDatabaseHelper } from '../../helpers/MyDatabaseHelper';

function createDatabaseHelperWithJunctionRows(rows: { parent_foodoffers_id: string; component_foodoffers_id: string | null }[]) {
  const queries: any[] = [];
  const helper = {
    getFoodofferComponentsHelper: () => ({
      readByQuery: async (query: any) => {
        queries.push(query);
        const parentIds: string[] = query.filter.parent_foodoffers_id._in;
        return rows.filter(row => parentIds.includes(row.parent_foodoffers_id));
      },
    }),
  } as unknown as MyDatabaseHelper;
  return { helper, queries };
}

describe('FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents', () => {
  it('returns the components of the deleted parents', async () => {
    const { helper } = createDatabaseHelperWithJunctionRows([
      { parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'component-1a' },
      { parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'component-1b' },
      { parent_foodoffers_id: 'parent-2', component_foodoffers_id: 'component-2a' },
    ]);
    expect(await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents(helper, ['parent-1'])).toEqual(['component-1a', 'component-1b']);
  });

  it('does not return ids that are deleted anyway, nor duplicates or empty references', async () => {
    const { helper } = createDatabaseHelperWithJunctionRows([
      { parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'component-1a' },
      { parent_foodoffers_id: 'parent-1', component_foodoffers_id: 'component-1a' },
      { parent_foodoffers_id: 'parent-1', component_foodoffers_id: null },
      { parent_foodoffers_id: 'parent-2', component_foodoffers_id: 'parent-1' },
    ]);
    expect(await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents(helper, ['parent-1', 'parent-2'])).toEqual(['component-1a']);
  });

  it('does not query the database for a component delete without parents', async () => {
    const { helper, queries } = createDatabaseHelperWithJunctionRows([]);
    expect(await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents(helper, [])).toEqual([]);
    expect(queries).toHaveLength(0);
  });
});

describe('FoodofferComponentsCleanupHelper.filterUnreferencedIds', () => {
  it('keeps only candidates that are neither a linked component nor a parent', async () => {
    const helper = {
      getFoodofferComponentsHelper: () => ({
        readByQuery: async () => [
          { parent_foodoffers_id: 'dish-1', component_foodoffers_id: 'linked-component' },
          { parent_foodoffers_id: 'parent-without-canteen', component_foodoffers_id: 'other-component' },
        ],
      }),
    } as unknown as MyDatabaseHelper;
    const candidates = ['linked-component', 'parent-without-canteen', 'orphan-1', 'orphan-2'];
    expect(await FoodofferComponentsCleanupHelper.filterUnreferencedIds(helper, candidates)).toEqual(['orphan-1', 'orphan-2']);
  });

  it('does not query the database without candidates', async () => {
    const helper = {
      getFoodofferComponentsHelper: () => {
        throw new Error('must not be called');
      },
    } as unknown as MyDatabaseHelper;
    expect(await FoodofferComponentsCleanupHelper.filterUnreferencedIds(helper, [])).toEqual([]);
  });
});
