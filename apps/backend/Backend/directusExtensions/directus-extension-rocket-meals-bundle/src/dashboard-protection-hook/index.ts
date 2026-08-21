import { defineHook } from '@directus/extensions-sdk';
import { Accountability } from '@directus/types';
import { DatabaseTypes, SystemDashboardHelper } from 'repo-depkit-common';
import { ApiContext } from '../helpers/ApiContext';
import { EventHelper } from '../helpers/EventHelper';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import { createMyForbiddenError } from '../helpers/MyDirectusError';
import { buildProtectedDashboardMessage, buildProtectedPanelMessage } from '../helpers/DashboardProtectionHelper';

const HOOK_NAME = 'dashboard-protection-hook';

const ADMIN_USER_CACHE_TTL_MS = 60 * 1000;

type CachedAdminUserId = {
  expiresAt: number;
  userId: string | null;
};

let cachedAdminUserId: CachedAdminUserId | undefined;

/**
 * The user id of the ADMIN_EMAIL account - the only account that may work on system dashboards
 * on a customer server. The deploy sync (directus-sync push) also logs in with it, so blocking
 * it would break every container start.
 */
async function getAdminUserId(apiContext: ApiContext): Promise<string | null> {
  if (cachedAdminUserId !== undefined && cachedAdminUserId.expiresAt > Date.now()) {
    return cachedAdminUserId.userId;
  }

  let adminUserId: string | null = null;
  const adminEmail = EnvVariableHelper.getAdminEmail();
  if (adminEmail) {
    try {
      const adminUser = await apiContext.database('directus_users').whereRaw('LOWER(email) = ?', [adminEmail.toLowerCase()]).first('id');
      adminUserId = adminUser?.id ?? null;
    } catch (error) {
      apiContext.logger.warn(`${HOOK_NAME}: could not resolve the admin user: ${error}`);
    }
  }

  cachedAdminUserId = { expiresAt: Date.now() + ADMIN_USER_CACHE_TTL_MS, userId: adminUserId };
  return adminUserId;
}

/**
 * True for the ADMIN_EMAIL user and for internal calls without accountability (e.g. our own
 * hooks or migrations). Being an administrator by role is explicitly not enough.
 */
async function isAdminEmailUser(apiContext: ApiContext, accountability: Accountability | null | undefined): Promise<boolean> {
  const userId = accountability?.user;
  if (!userId) {
    return true;
  }
  const adminUserId = await getAdminUserId(apiContext);
  return adminUserId !== null && adminUserId === userId;
}

/**
 * Directus passes the affected primary keys as meta.keys (update) or as the input itself
 * (delete). Both are normalized to a list of strings here.
 */
function getKeysFromMeta(meta: Record<string, any> | undefined): string[] {
  const keys = meta?.keys ?? (meta?.key !== undefined && meta?.key !== null ? [meta.key] : []);
  return toKeyList(keys);
}

function toKeyList(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map(key => String(key));
  }
  if (input === undefined || input === null) {
    return [];
  }
  return [String(input)];
}

export default defineHook(async ({ filter }, apiContext) => {
  /**
   * The protection only applies on customer servers and never to the ADMIN_EMAIL user.
   */
  async function isProtectionActiveFor(accountability: Accountability | null | undefined): Promise<boolean> {
    if (!EnvVariableHelper.isDashboardProtectionEnabled()) {
      return false;
    }
    return !(await isAdminEmailUser(apiContext, accountability));
  }

  /**
   * Names of those dashboards among the given ids that are system dashboards.
   */
  async function getSystemDashboardNames(dashboardIds: string[]): Promise<string[]> {
    if (dashboardIds.length === 0) {
      return [];
    }
    try {
      const dashboards = await apiContext.database('directus_dashboards').whereIn('id', dashboardIds).select('name');
      return dashboards.map((dashboard: Partial<DatabaseTypes.DirectusDashboards>) => dashboard.name ?? '').filter((name: string) => SystemDashboardHelper.isSystemDashboardName(name));
    } catch (error) {
      apiContext.logger.warn(`${HOOK_NAME}: could not read the dashboards: ${error}`);
      return [];
    }
  }

  async function getDashboardIdsOfPanels(panelIds: string[]): Promise<string[]> {
    if (panelIds.length === 0) {
      return [];
    }
    try {
      const panels = await apiContext.database('directus_panels').whereIn('id', panelIds).select('dashboard');
      return panels.map((panel: Partial<DatabaseTypes.DirectusPanels>) => panel.dashboard).filter((dashboardId: unknown): dashboardId is string => typeof dashboardId === 'string');
    } catch (error) {
      apiContext.logger.warn(`${HOOK_NAME}: could not read the dashboards of the panels: ${error}`);
      return [];
    }
  }

  async function assertDashboardsAreEditable(dashboardIds: string[], accountability: Accountability | null | undefined) {
    if (dashboardIds.length === 0 || !(await isProtectionActiveFor(accountability))) {
      return;
    }

    const systemDashboardNames = await getSystemDashboardNames(dashboardIds);
    if (systemDashboardNames.length === 0) {
      return;
    }

    apiContext.logger.info(`${HOOK_NAME}: blocked change on system dashboard(s): ${systemDashboardNames.join(', ')}`);
    throw createMyForbiddenError(buildProtectedDashboardMessage(systemDashboardNames));
  }

  /**
   * Panels are protected through their dashboard: they may not be changed inside a system
   * dashboard, and they may not be moved into one.
   */
  async function assertPanelsAreEditable(panelIds: string[], targetDashboardIds: string[], accountability: Accountability | null | undefined) {
    if (panelIds.length === 0 && targetDashboardIds.length === 0) {
      return;
    }
    if (!(await isProtectionActiveFor(accountability))) {
      return;
    }

    const dashboardIds = [...targetDashboardIds, ...(await getDashboardIdsOfPanels(panelIds))];
    const systemDashboardNames = await getSystemDashboardNames(dashboardIds);
    if (systemDashboardNames.length === 0) {
      return;
    }

    apiContext.logger.info(`${HOOK_NAME}: blocked change on panel(s) of system dashboard(s): ${systemDashboardNames.join(', ')}`);
    throw createMyForbiddenError(buildProtectedPanelMessage(systemDashboardNames));
  }

  filter(EventHelper.DASHBOARDS_CREATE_EVENT, async (input, _meta, eventContext) => {
    const payload = input as Partial<DatabaseTypes.DirectusDashboards>;

    // Everything the ADMIN_EMAIL user creates becomes a system dashboard, so a dashboard that is
    // meant to be shipped is marked right from the start.
    if (await isAdminEmailUser(apiContext, eventContext?.accountability)) {
      payload.name = SystemDashboardHelper.withSystemSuffix(payload.name);
      return payload;
    }

    // Nobody else may create a dashboard that looks like a system dashboard - they would lock
    // themselves out of their own dashboard.
    if (EnvVariableHelper.isDashboardProtectionEnabled() && SystemDashboardHelper.isSystemDashboardName(payload.name)) {
      apiContext.logger.info(`${HOOK_NAME}: removed the system marker from a new dashboard: ${payload.name}`);
      payload.name = SystemDashboardHelper.withoutSystemSuffix(payload.name);
    }
    return payload;
  });

  filter(EventHelper.DASHBOARDS_UPDATE_EVENT, async (input, meta, eventContext) => {
    const payload = input as Partial<DatabaseTypes.DirectusDashboards>;
    await assertDashboardsAreEditable(getKeysFromMeta(meta), eventContext?.accountability);

    // Renaming an own dashboard into a system dashboard is not allowed either.
    if (payload.name !== undefined && (await isProtectionActiveFor(eventContext?.accountability)) && SystemDashboardHelper.isSystemDashboardName(payload.name)) {
      apiContext.logger.info(`${HOOK_NAME}: removed the system marker from a renamed dashboard: ${payload.name}`);
      payload.name = SystemDashboardHelper.withoutSystemSuffix(payload.name);
    }
    return payload;
  });

  filter(EventHelper.DASHBOARDS_DELETE_EVENT, async (input, _meta, eventContext) => {
    await assertDashboardsAreEditable(toKeyList(input), eventContext?.accountability);
    return input;
  });

  filter(EventHelper.PANELS_CREATE_EVENT, async (input, _meta, eventContext) => {
    const payload = input as Partial<DatabaseTypes.DirectusPanels>;
    const dashboardId = typeof payload?.dashboard === 'string' ? payload.dashboard : undefined;
    await assertPanelsAreEditable([], dashboardId ? [dashboardId] : [], eventContext?.accountability);
    return input;
  });

  filter(EventHelper.PANELS_UPDATE_EVENT, async (input, meta, eventContext) => {
    const payload = input as Partial<DatabaseTypes.DirectusPanels>;
    const targetDashboardId = typeof payload?.dashboard === 'string' ? payload.dashboard : undefined;
    await assertPanelsAreEditable(getKeysFromMeta(meta), targetDashboardId ? [targetDashboardId] : [], eventContext?.accountability);
    return input;
  });

  filter(EventHelper.PANELS_DELETE_EVENT, async (input, _meta, eventContext) => {
    await assertPanelsAreEditable(toKeyList(input), [], eventContext?.accountability);
    return input;
  });
});
