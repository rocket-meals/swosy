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
   * Ids of the component foodoffers to delete together with the given parent foodoffers: their components that no other
   * parent uses. A component shared with another parent keeps existing, only its junction row to the deleted parent goes
   * (via the database cascade). Parents themselves are excluded, so nothing is deleted twice.
   */
  static async getComponentFoodofferIdsOfParents(myDatabaseHelper: MyDatabaseHelper, parentFoodofferIds: (string | number)[]): Promise<string[]> {
    if (parentFoodofferIds.length === 0) {
      return [];
    }
    const parentIds = parentFoodofferIds.map(String);
    const junctionRows = await myDatabaseHelper.getFoodofferComponentsHelper().readByQuery({
      filter: { parent_foodoffers_id: { _in: parentIds } },
      fields: ['component_foodoffers_id'],
      limit: -1,
    });
    const parentIdSet = new Set(parentIds);
    const componentIds = FoodofferComponentsCleanupHelper.getComponentIds(junctionRows).filter(id => !parentIdSet.has(id));
    return FoodofferComponentsCleanupHelper.withoutComponentsStillUsed(myDatabaseHelper, componentIds, { parent_foodoffers_id: { _nin: parentIds } });
  }

  /**
   * Ids of the component foodoffers to delete together with the given junction rows (a component deselected from its
   * parent): their components that are not used by any other junction row.
   */
  static async getComponentFoodofferIdsOfJunctionRows(myDatabaseHelper: MyDatabaseHelper, junctionIds: (string | number)[]): Promise<string[]> {
    if (junctionIds.length === 0) {
      return [];
    }
    const junctionRows = await myDatabaseHelper.getFoodofferComponentsHelper().readByQuery({
      filter: { id: { _in: junctionIds } },
      fields: ['component_foodoffers_id'],
      limit: -1,
    });
    const componentIds = FoodofferComponentsCleanupHelper.getComponentIds(junctionRows);
    return FoodofferComponentsCleanupHelper.withoutComponentsStillUsed(myDatabaseHelper, componentIds, { id: { _nin: junctionIds } });
  }

  /**
   * Removes the components that are still referenced by a junction row matching `otherJunctionRowsFilter`, i.e. by a
   * parent that is not being deleted.
   */
  static async withoutComponentsStillUsed(myDatabaseHelper: MyDatabaseHelper, componentIds: string[], otherJunctionRowsFilter: any): Promise<string[]> {
    if (componentIds.length === 0) {
      return [];
    }
    const otherJunctionRows = await myDatabaseHelper.getFoodofferComponentsHelper().readByQuery({
      filter: { _and: [{ component_foodoffers_id: { _in: componentIds } }, otherJunctionRowsFilter] } as any,
      fields: ['component_foodoffers_id'],
      limit: -1,
    });
    const stillUsedIds = new Set(FoodofferComponentsCleanupHelper.getComponentIds(otherJunctionRows));
    return componentIds.filter(id => !stillUsedIds.has(id));
  }

  private static getComponentIds(junctionRows: { component_foodoffers_id?: unknown }[]): string[] {
    const componentIds = junctionRows.map(row => (typeof row.component_foodoffers_id === 'string' ? row.component_foodoffers_id : null)).filter((id): id is string => !!id);
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
