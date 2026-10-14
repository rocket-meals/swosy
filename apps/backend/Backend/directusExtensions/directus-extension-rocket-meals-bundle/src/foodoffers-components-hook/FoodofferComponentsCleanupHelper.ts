import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';

/**
 * Component foodoffers (alias "Baguette", "Senfvinaigrette", ...) are stored as own rows in `foodoffers` and linked to
 * their parent foodoffer via the junction `foodoffers_components`.
 *
 * Deleting a parent foodoffer (e.g. the food sync replacing a changed offer) removes the junction rows via the database
 * `ON DELETE CASCADE` of `parent_foodoffers_id`. That cascade happens inside Postgres, so no Directus delete hook runs for
 * the junction rows and the component foodoffers stay behind - without date, canteen, food and without any parent.
 *
 * This helper finds the component foodoffers of parents before they are deleted, and cleans up components that are
 * already orphaned.
 */
export class FoodofferComponentsCleanupHelper {
  static readonly DELETE_BATCH_SIZE = 1000;
  static readonly MAX_DELETES_PER_RUN = 50000;
  // Skip rows created in the last hour, so a component is never caught between its creation and its junction row.
  static readonly MIN_AGE_MS = 60 * 60 * 1000;

  /**
   * Ids of the component foodoffers linked to the given parent foodoffers. Parents themselves are excluded, so a delete
   * of a parent together with its components does not delete anything twice.
   */
  static async getComponentFoodofferIdsOfParents(myDatabaseHelper: MyDatabaseHelper, parentFoodofferIds: (string | number)[]): Promise<string[]> {
    if (parentFoodofferIds.length === 0) {
      return [];
    }
    const junctionRows = await myDatabaseHelper.getFoodofferComponentsHelper().readByQuery({
      filter: { parent_foodoffers_id: { _in: parentFoodofferIds.map(String) } },
      fields: ['component_foodoffers_id'],
      limit: -1,
    });
    const parentIdSet = new Set(parentFoodofferIds.map(String));
    const componentIds = junctionRows
      .map(row => (typeof row.component_foodoffers_id === 'string' ? row.component_foodoffers_id : null))
      .filter((id): id is string => !!id && !parentIdSet.has(id));
    return Array.from(new Set(componentIds));
  }

  /**
   * One page of candidates: foodoffers without canteen, date and food (exactly how the food sync creates components),
   * created more than MIN_AGE_MS ago, sorted by id.
   * Foodoffers without date but with a canteen (offers that are valid all the time) are never candidates.
   */
  static async readCandidateIds(myDatabaseHelper: MyDatabaseHelper, offset: number, limit: number): Promise<string[]> {
    const createdBefore = new Date(Date.now() - FoodofferComponentsCleanupHelper.MIN_AGE_MS).toISOString();
    const rows = await myDatabaseHelper.getFoodoffersHelper().readByQuery({
      filter: { _and: [{ canteen: { _null: true } }, { date: { _null: true } }, { food: { _null: true } }, { date_created: { _lt: createdBefore } }] } as any,
      fields: ['id'],
      sort: ['id'],
      offset: offset,
      limit: limit,
    });
    return rows.map(row => String(row.id));
  }

  /**
   * The candidates that are not referenced by `foodoffers_components` at all - neither as component nor as parent.
   */
  static async filterUnreferencedIds(myDatabaseHelper: MyDatabaseHelper, candidateIds: string[]): Promise<string[]> {
    if (candidateIds.length === 0) {
      return [];
    }
    const junctionRows = await myDatabaseHelper.getFoodofferComponentsHelper().readByQuery({
      filter: { _or: [{ component_foodoffers_id: { _in: candidateIds } }, { parent_foodoffers_id: { _in: candidateIds } }] } as any,
      fields: ['component_foodoffers_id', 'parent_foodoffers_id'],
      limit: -1,
    });
    const referencedIds = new Set<string>();
    for (const row of junctionRows) {
      if (typeof row.component_foodoffers_id === 'string') {
        referencedIds.add(row.component_foodoffers_id);
      }
      if (typeof row.parent_foodoffers_id === 'string') {
        referencedIds.add(row.parent_foodoffers_id);
      }
    }
    return candidateIds.filter(id => !referencedIds.has(id));
  }

  /**
   * Walks through all candidates page by page and deletes the unreferenced ones, at most MAX_DELETES_PER_RUN per call
   * to keep the database load of a single run bounded. Returns the number of deleted foodoffers.
   * Deleted rows move the following rows forward, so the offset only advances by the candidates that were kept.
   */
  static async deleteOrphanedComponentFoodoffers(myDatabaseHelper: MyDatabaseHelper, log: (message: string) => void): Promise<number> {
    const foodoffersHelper = myDatabaseHelper.getFoodoffersHelper();
    const state = { deleted: 0, offset: 0 };
    while (state.deleted < FoodofferComponentsCleanupHelper.MAX_DELETES_PER_RUN) {
      const candidateIds = await FoodofferComponentsCleanupHelper.readCandidateIds(myDatabaseHelper, state.offset, FoodofferComponentsCleanupHelper.DELETE_BATCH_SIZE); // NOSONAR S9382 - sequential on purpose: one page after another to keep the database load bounded
      if (candidateIds.length === 0) {
        break;
      }
      const orphanedIds = (await FoodofferComponentsCleanupHelper.filterUnreferencedIds(myDatabaseHelper, candidateIds)).slice(0, FoodofferComponentsCleanupHelper.MAX_DELETES_PER_RUN - state.deleted); // NOSONAR S9382 - sequential on purpose: one page after another to keep the database load bounded
      if (orphanedIds.length > 0) {
        await foodoffersHelper.deleteMany(orphanedIds); // NOSONAR S9382 - sequential on purpose: one page after another to keep the database load bounded
        state.deleted += orphanedIds.length;
        log(`deleted ${orphanedIds.length} orphaned component foodoffers (${state.deleted} in this run)`);
      }
      state.offset += candidateIds.length - orphanedIds.length;
    }
    return state.deleted;
  }
}
