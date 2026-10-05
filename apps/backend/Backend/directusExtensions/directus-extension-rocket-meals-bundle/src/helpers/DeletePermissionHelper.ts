import type { Accountability, PrimaryKey } from '@directus/types';
import { ApiContext } from './ApiContext';
import { MyEventContext } from './MyDatabaseHelper';

/**
 * Since Directus 11.13 the `<scope>.delete` filter hooks run *before* Directus checks whether the caller may
 * delete the items at all (https://directus.com/docs/releases/breaking-changes/version-11, "Delete Hook Execution
 * Timing"). A delete filter hook that changes data (reassigning files, deleting related items, ...) would therefore
 * also do so for a request that Directus rejects with 403 a moment later.
 *
 * Delete filter hooks with side effects call {@link canDeleteAll} first and only run their side effects if the
 * caller is allowed to delete all keys. Directus itself still rejects the forbidden delete afterwards.
 */
export class DeletePermissionHelper {
  /**
   * Whether the accountability of the event may delete every given key of the collection. Uses the same check
   * Directus runs right after the filter hooks (`PermissionsService.getItemPermissions` → `validateAccess`).
   *
   * - No accountability (internal call, e.g. from our own services) or admin → allowed.
   * - Accountability without user (public/anonymous) → not allowed: Directus offers no item check for it, so we fail
   *   closed and skip the side effects.
   */
  static async canDeleteAll(apiContext: ApiContext, eventContext: MyEventContext | undefined, collection: string, keys: PrimaryKey[]): Promise<boolean> {
    const accountability: Accountability | null | undefined = eventContext?.accountability;
    if (!accountability || accountability.admin === true) {
      return true;
    }
    if (!accountability.user) {
      return false;
    }

    const { PermissionsService } = apiContext.services;
    const permissionsService = new PermissionsService({
      accountability: accountability,
      knex: eventContext?.database || apiContext.database,
      schema: eventContext?.schema || (await apiContext.getSchema()),
    });

    for (const key of keys) {
      try {
        const itemPermissions = await permissionsService.getItemPermissions(collection, String(key));
        if (itemPermissions?.delete?.access !== true) {
          return false;
        }
      } catch (error) {
        return false;
      }
    }
    return true;
  }
}
