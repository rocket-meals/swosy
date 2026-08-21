/**
 * Single source of truth for how a dashboard that is shipped with Rocket Meals is recognized.
 *
 * Shipped ("system") dashboards are part of the repository dump in
 * data/directus-sync-data and are reset to that state on every deploy. They are marked by a
 * suffix at the end of their name, e.g. "Mensen (System)", so both the backend and the people
 * working in Directus can tell them apart from dashboards a customer created themselves.
 */
export class SystemDashboardHelper {
  /** The marker at the end of the name of a shipped dashboard. */
  public static readonly SYSTEM_NAME_SUFFIX = '(System)';

  public static isSystemDashboardName(name: string | null | undefined): boolean {
    return (name ?? '').trim().endsWith(SystemDashboardHelper.SYSTEM_NAME_SUFFIX);
  }

  /**
   * Returns the name with the system marker. Idempotent - an already marked name is returned
   * unchanged (apart from surrounding whitespace).
   */
  public static withSystemSuffix(name: string | null | undefined): string {
    const trimmedName = (name ?? '').trim();
    if (SystemDashboardHelper.isSystemDashboardName(trimmedName)) {
      return trimmedName;
    }
    if (trimmedName.length === 0) {
      return SystemDashboardHelper.SYSTEM_NAME_SUFFIX;
    }
    return `${trimmedName} ${SystemDashboardHelper.SYSTEM_NAME_SUFFIX}`;
  }

  /**
   * Returns the name without the system marker.
   */
  public static withoutSystemSuffix(name: string | null | undefined): string {
    const trimmedName = (name ?? '').trim();
    if (!SystemDashboardHelper.isSystemDashboardName(trimmedName)) {
      return trimmedName;
    }
    return trimmedName.slice(0, trimmedName.length - SystemDashboardHelper.SYSTEM_NAME_SUFFIX.length).trim();
  }
}
