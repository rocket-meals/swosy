import { PrimaryKey } from '@directus/types';

/** The part of a hook's `meta` that carries the affected primary keys. */
export type HookMetaWithKeys = { keys?: unknown; key?: unknown } | undefined | null;

/**
 * The primary keys a hook was called for.
 *
 * Directus hands them over in more than one shape: `meta.keys` for updates and deletes,
 * `meta.key` for a single item, and a bare list as the payload of a delete filter. Several hooks
 * used to unwrap that by hand, each with its own three lines of array/undefined juggling.
 */
export class HookKeysHelper {
  /** Normalizes a single key, a list of keys or nothing into a list of usable primary keys. */
  static toPrimaryKeys(value: unknown): PrimaryKey[] {
    if (value === undefined || value === null) {
      return [];
    }
    const values = Array.isArray(value) ? value : [value];
    return values.filter((key): key is PrimaryKey => (typeof key === 'string' && key.length > 0) || typeof key === 'number');
  }

  /** The primary keys from a hook's `meta`, whether they arrive as `keys` or as `key`. */
  static getKeysFromMeta(meta: HookMetaWithKeys): PrimaryKey[] {
    const keys = HookKeysHelper.toPrimaryKeys(meta?.keys);
    if (keys.length > 0) {
      return keys;
    }
    return HookKeysHelper.toPrimaryKeys(meta?.key);
  }
}
