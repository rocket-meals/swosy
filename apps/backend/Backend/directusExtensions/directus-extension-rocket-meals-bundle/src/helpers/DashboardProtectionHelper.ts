import { SystemDashboardHelper } from 'repo-depkit-common';

/**
 * Wording of the dashboard-protection-hook. Kept free of any Directus dependency so it can be
 * unit tested without a running server.
 */

const COMMON_HINT = `System-Dashboards werden mit Rocket Meals ausgeliefert und bei jedem Update wieder auf den ` + `Auslieferungsstand zurückgesetzt. Bitte lege für eigene Auswertungen ein neues Dashboard ohne ` + `"${SystemDashboardHelper.SYSTEM_NAME_SUFFIX}" im Namen an - eigene Dashboards bleiben bei Updates unverändert erhalten.`;

function formatNames(names: string[]): string {
  const usableNames = names.filter(name => (name ?? '').trim().length > 0);
  if (usableNames.length === 0) {
    return '';
  }
  return ` (${usableNames.join(', ')})`;
}

export function buildProtectedDashboardMessage(dashboardNames: string[]): string {
  return `Dieses Dashboard${formatNames(dashboardNames)} ist ein System-Dashboard und darf nicht bearbeitet werden. ${COMMON_HINT}`;
}

export function buildProtectedPanelMessage(dashboardNames: string[]): string {
  return `Dieses Panel gehört zu einem System-Dashboard${formatNames(dashboardNames)} und darf nicht bearbeitet werden. ${COMMON_HINT}`;
}
