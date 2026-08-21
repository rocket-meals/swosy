/**
 * Single source of truth for how a dashboard is marked in its name.
 *
 * Dashboards carry the instance they belong to as a suffix, e.g. `Mensen (System)` or
 * `Auswertung Mensa (Osnabrück)`:
 *
 * - **System dashboards** are shipped with Rocket Meals, live in the repository dump in
 *   data/directus-sync-data and are reset to that state on every deploy. Only the ADMIN_EMAIL
 *   user may change them.
 * - **Dashboards a customer creates** get the key of their own server, so it is visible at a
 *   glance which dashboards belong to the customer and survive an update untouched.
 */
export class SystemDashboardHelper {
  /** The key inside the marker of a shipped dashboard. */
  public static readonly SYSTEM_NAME_KEY = 'System';

  /** The marker of a shipped dashboard, e.g. `(System)`. */
  public static readonly SYSTEM_NAME_SUFFIX = SystemDashboardHelper.buildNameSuffix(SystemDashboardHelper.SYSTEM_NAME_KEY);

  /** The marker for a key, e.g. `Osnabrück` becomes `(Osnabrück)`. */
  public static buildNameSuffix(key: string): string {
    return `(${key.trim()})`;
  }

  public static hasNameSuffix(name: string | null | undefined, key: string): boolean {
    return (name ?? '').trim().endsWith(SystemDashboardHelper.buildNameSuffix(key));
  }

  /**
   * Returns the name with the marker for the given key. Idempotent - an already marked name is
   * returned unchanged (apart from surrounding whitespace).
   */
  public static withNameSuffix(name: string | null | undefined, key: string): string {
    const suffix = SystemDashboardHelper.buildNameSuffix(key);
    const trimmedName = (name ?? '').trim();
    if (trimmedName.endsWith(suffix)) {
      return trimmedName;
    }
    if (trimmedName.length === 0) {
      return suffix;
    }
    return `${trimmedName} ${suffix}`;
  }

  /** Returns the name without the marker for the given key. */
  public static withoutNameSuffix(name: string | null | undefined, key: string): string {
    const suffix = SystemDashboardHelper.buildNameSuffix(key);
    const trimmedName = (name ?? '').trim();
    if (!trimmedName.endsWith(suffix)) {
      return trimmedName;
    }
    return trimmedName.slice(0, trimmedName.length - suffix.length).trim();
  }

  public static isSystemDashboardName(name: string | null | undefined): boolean {
    return SystemDashboardHelper.hasNameSuffix(name, SystemDashboardHelper.SYSTEM_NAME_KEY);
  }

  public static withSystemSuffix(name: string | null | undefined): string {
    return SystemDashboardHelper.withNameSuffix(name, SystemDashboardHelper.SYSTEM_NAME_KEY);
  }

  public static withoutSystemSuffix(name: string | null | undefined): string {
    return SystemDashboardHelper.withoutNameSuffix(name, SystemDashboardHelper.SYSTEM_NAME_KEY);
  }
}
