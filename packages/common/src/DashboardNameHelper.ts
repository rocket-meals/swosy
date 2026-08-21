/**
 * Single source of truth for how a dashboard is marked in its name.
 *
 * Dashboards carry the instance they belong to as a marker in square brackets, e.g.
 * `Mensen [System]` or `Auswertung Mensa [Osnabrück]`:
 *
 * - **System dashboards** are shipped with Rocket Meals, live in the repository dump in
 *   data/directus-sync-data and are reset to that state on every deploy. Only the ADMIN_EMAIL
 *   user may change them.
 * - **Every other dashboard** carries the key of the server it was created on, so it is visible
 *   at a glance which dashboards belong to the customer and survive an update untouched.
 *
 * Square brackets, not parentheses: Directus appends a `(copy)` of its own when a dashboard is
 * duplicated, and a marker that cannot be confused with that stays readable next to it -
 * `Mensen [System] (copy)`.
 *
 * A marker is searched for anywhere in the name, not only at its end, exactly because of that
 * `(copy)`: a duplicate of a system dashboard still has to be recognized as one, so the hook can
 * turn the copy into a dashboard of the customer instead of a second system dashboard.
 */
export class DashboardNameHelper {
  /** The key inside the marker of a shipped dashboard. */
  public static readonly SYSTEM_NAME_KEY = 'System';

  /** The marker of a shipped dashboard, e.g. `[System]`. */
  public static readonly SYSTEM_NAME_MARKER = DashboardNameHelper.buildNameMarker(DashboardNameHelper.SYSTEM_NAME_KEY);

  /** The marker for a key, e.g. `Osnabrück` becomes `[Osnabrück]`. */
  public static buildNameMarker(key: string): string {
    return `[${key.trim()}]`;
  }

  public static hasNameMarker(name: string | null | undefined, key: string): boolean {
    return (name ?? '').includes(DashboardNameHelper.buildNameMarker(key));
  }

  /**
   * Returns the name with the marker for the given key, appended at the end. Idempotent - a name
   * that already carries the marker is returned unchanged (apart from whitespace).
   */
  public static withNameMarker(name: string | null | undefined, key: string): string {
    const marker = DashboardNameHelper.buildNameMarker(key);
    const cleanedName = DashboardNameHelper.cleanUpWhitespace(name);
    if (cleanedName.includes(marker)) {
      return cleanedName;
    }
    if (cleanedName.length === 0) {
      return marker;
    }
    return `${cleanedName} ${marker}`;
  }

  /** Returns the name without the marker for the given key, wherever it appeared. */
  public static withoutNameMarker(name: string | null | undefined, key: string): string {
    const marker = DashboardNameHelper.buildNameMarker(key);
    return DashboardNameHelper.cleanUpWhitespace((name ?? '').split(marker).join(' '));
  }

  public static isSystemDashboardName(name: string | null | undefined): boolean {
    return DashboardNameHelper.hasNameMarker(name, DashboardNameHelper.SYSTEM_NAME_KEY);
  }

  public static withSystemMarker(name: string | null | undefined): string {
    return DashboardNameHelper.withNameMarker(name, DashboardNameHelper.SYSTEM_NAME_KEY);
  }

  public static withoutSystemMarker(name: string | null | undefined): string {
    return DashboardNameHelper.withoutNameMarker(name, DashboardNameHelper.SYSTEM_NAME_KEY);
  }

  /** Collapses the double spaces a removed marker leaves behind. */
  private static cleanUpWhitespace(name: string | null | undefined): string {
    return (name ?? '').replace(/\s+/g, ' ').trim();
  }
}
