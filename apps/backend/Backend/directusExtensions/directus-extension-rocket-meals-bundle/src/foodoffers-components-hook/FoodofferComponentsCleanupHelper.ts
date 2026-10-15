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
type Candidate = { id: string; dateCreated: string };
type CandidateCursor = { dateCreated: string; idsAtDateCreated: string[] };

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
   * created more than MIN_AGE_MS ago, sorted by date_created and id and starting after `cursor` (keyset paging, so a page
   * costs the same no matter how far the walk already is - an offset would skip all previous rows again on every page).
   * The cursor uses date_created, because `id` is a uuid and Directus does not allow `_gt` on uuid fields. Rows created
   * in the same millisecond as the cursor are told apart by the ids already seen with that date_created.
   * Foodoffers without date but with a canteen (offers that are valid all the time) are never candidates.
   */
  static async readCandidates(myDatabaseHelper: MyDatabaseHelper, cursor: CandidateCursor | null, limit: number): Promise<Candidate[]> {
    const createdBefore = new Date(Date.now() - FoodofferComponentsCleanupHelper.MIN_AGE_MS).toISOString();
    const conditions: any[] = [{ canteen: { _null: true } }, { date: { _null: true } }, { food: { _null: true } }, { date_created: { _lt: createdBefore } }];
    if (cursor !== null) {
      conditions.push({ _or: [{ date_created: { _gt: cursor.dateCreated } }, { _and: [{ date_created: { _eq: cursor.dateCreated } }, { id: { _nin: cursor.idsAtDateCreated } }] }] });
    }
    const rows = await myDatabaseHelper.getFoodoffersHelper().readByQuery({
      filter: { _and: conditions } as any,
      fields: ['id', 'date_created'],
      sort: ['date_created', 'id'],
      limit: limit,
    });
    return rows.map(row => ({ id: String(row.id), dateCreated: String(row.date_created) }));
  }

  /**
   * The cursor after `page`: the date_created of its last row plus all ids seen with that date_created, including those
   * of earlier pages when the whole page shares the date_created of the previous cursor.
   */
  static getNextCursor(previous: CandidateCursor | null, page: Candidate[]): CandidateCursor | null {
    const last = page[page.length - 1];
    if (last === undefined) {
      return previous;
    }
    const idsOfPage = page.filter(candidate => candidate.dateCreated === last.dateCreated).map(candidate => candidate.id);
    const idsOfPreviousPages = previous !== null && previous.dateCreated === last.dateCreated ? previous.idsAtDateCreated : [];
    return { dateCreated: last.dateCreated, idsAtDateCreated: [...idsOfPreviousPages, ...idsOfPage] };
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
   * The next page starts after the last row of the current page, so deleted rows do not shift the following pages.
   */
  static async deleteOrphanedComponentFoodoffers(myDatabaseHelper: MyDatabaseHelper, log: (message: string) => Promise<void>): Promise<number> {
    const foodoffersHelper = myDatabaseHelper.getFoodoffersHelper();
    const state: { deleted: number; cursor: CandidateCursor | null } = { deleted: 0, cursor: null };
    while (state.deleted < FoodofferComponentsCleanupHelper.MAX_DELETES_PER_RUN) {
      const candidates = await FoodofferComponentsCleanupHelper.readCandidates(myDatabaseHelper, state.cursor, FoodofferComponentsCleanupHelper.DELETE_BATCH_SIZE); // NOSONAR S9382 - sequential on purpose: one page after another to keep the database load bounded
      if (candidates.length === 0) {
        break;
      }
      const candidateIds = candidates.map(candidate => candidate.id);
      const orphanedIds = (await FoodofferComponentsCleanupHelper.filterUnreferencedIds(myDatabaseHelper, candidateIds)).slice(0, FoodofferComponentsCleanupHelper.MAX_DELETES_PER_RUN - state.deleted); // NOSONAR S9382 - sequential on purpose: one page after another to keep the database load bounded
      if (orphanedIds.length > 0) {
        await foodoffersHelper.deleteMany(orphanedIds); // NOSONAR S9382 - sequential on purpose: one page after another to keep the database load bounded
        state.deleted += orphanedIds.length;
        await log(`Deleted ${orphanedIds.length} orphaned component foodoffers (${state.deleted} in this run)`); // NOSONAR S9382 - sequential on purpose: one page after another to keep the database load bounded
      }
      if (candidates.length < FoodofferComponentsCleanupHelper.DELETE_BATCH_SIZE) {
        break;
      }
      state.cursor = FoodofferComponentsCleanupHelper.getNextCursor(state.cursor, candidates);
    }
    return state.deleted;
  }
}
