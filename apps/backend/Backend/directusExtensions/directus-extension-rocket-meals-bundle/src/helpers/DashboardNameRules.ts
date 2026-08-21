import { DashboardNameHelper } from 'repo-depkit-common';
import { SyncForCustomerEnum } from './EnvVariableHelper';

/**
 * How a dashboard name is built, depending on who owns the dashboard.
 *
 * Kept free of any Directus dependency so the rules can be unit tested without a running server.
 */

/**
 * Every key a dashboard name may carry as a marker: the system marker and the key of any server.
 * An inherited marker is stripped before the current one is set, e.g. when the ADMIN_EMAIL user
 * duplicates a dashboard of the test system.
 */
export const ALL_DASHBOARD_NAME_KEYS: readonly string[] = [DashboardNameHelper.SYSTEM_NAME_KEY, ...Object.values(SyncForCustomerEnum)];

/**
 * The name a dashboard of the ADMIN_EMAIL user carries: the system marker, and no marker of any
 * server. Every existing marker is stripped first, so the system marker ends up at the very end -
 * behind a `(copy)` Directus appended while duplicating: `App [Test] (copy)` becomes
 * `App (copy) [System]`.
 */
export function buildSystemDashboardName(name: string | null | undefined): string {
  return DashboardNameHelper.withSystemMarker(DashboardNameHelper.withoutNameMarkers(name, ALL_DASHBOARD_NAME_KEYS));
}

/**
 * The name a dashboard of everybody else carries: the key of this server, and never the system
 * marker. Without a known server key the name is only cleaned up - a made up marker is worse than
 * none.
 */
export function buildServerDashboardName(name: string | null | undefined, serverKey: string | null | undefined): string {
  const cleanedName = DashboardNameHelper.withoutNameMarkers(name, ALL_DASHBOARD_NAME_KEYS);
  if (!serverKey) {
    return cleanedName;
  }
  return DashboardNameHelper.withNameMarker(cleanedName, serverKey);
}
