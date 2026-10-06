/**
 * A relation field as Directus hands it out: the plain key (`"abc"`) when the relation was not
 * expanded, the related row (`{ id: "abc", … }`) when it was, or nothing at all.
 */
export type RelationValue = { id: string | number } | string | number | null | undefined;

/**
 * Reads relation fields without caring whether the caller expanded them – the same code then works
 * for `fields: ['chat']` and `fields: ['chat.*']`, in the apps as in the backend.
 */
export class RelationHelper {
  /** The key of the related row, always as string, or `undefined` when the relation is empty. */
  static getId(value: RelationValue): string | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'object') {
      return value.id === null || value.id === undefined ? undefined : String(value.id);
    }
    return String(value);
  }

  /** Whether the relation points to a row at all. */
  static isSet(value: RelationValue): boolean {
    return RelationHelper.getId(value) !== undefined;
  }
}
