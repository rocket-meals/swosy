import { defineHook } from '@directus/extensions-sdk';
import { Accountability } from '@directus/types';
import { CollectionNames, DatabaseTypes, SystemDashboardHelper } from 'repo-depkit-common';
import { MyDatabaseHelper, MyEventContext } from '../helpers/MyDatabaseHelper';
import { EventHelper } from '../helpers/EventHelper';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import { createMyForbiddenError } from '../helpers/MyDirectusError';
import { BackendTranslationKeys, BackendTranslator, ProfileWithLanguage } from '../helpers/translations';

const HOOK_NAME = 'dashboard-protection-hook';

/**
 * Who is acting, and may they touch a system dashboard?
 *
 * Only the user from ADMIN_EMAIL may - being an administrator by role is explicitly not enough.
 * The deploy sync (directus-sync push) logs in with that very account, so blocking it would make
 * every container start fail while pushing the shipped dashboards.
 */
type ActingUserInfo = {
  user: DatabaseTypes.DirectusUsers | undefined;
  isAdminEmailUser: boolean;
};

function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = EnvVariableHelper.getAdminEmail();
  if (!adminEmail || !email) {
    return false;
  }
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
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
  async function getActingUserInfo(myDatabaseHelper: MyDatabaseHelper, accountability: Accountability | null | undefined): Promise<ActingUserInfo> {
    const userId = accountability?.user;
    if (!userId) {
      // Internal calls without accountability (other hooks, migrations) act as the system.
      return { user: undefined, isAdminEmailUser: true };
    }

    try {
      const user = await myDatabaseHelper.getUsersHelper().readOne(userId, {
        // The profile carries the language the error message has to be rendered in.
        fields: ['id', 'email', 'profile.language'],
      });
      return { user: user, isAdminEmailUser: isAdminEmail(user?.email) };
    } catch (error) {
      apiContext.logger.warn(`${HOOK_NAME}: could not read the acting user: ${error}`);
      return { user: undefined, isAdminEmailUser: false };
    }
  }

  /**
   * On the test system the shipped dashboards are authored, so everybody with the according
   * Directus rights may edit them. On a customer server only the ADMIN_EMAIL user may.
   */
  function isProtectionActiveFor(actingUserInfo: ActingUserInfo): boolean {
    return !EnvVariableHelper.isTestServer() && !actingUserInfo.isAdminEmailUser;
  }

  function buildForbiddenError(actingUserInfo: ActingUserInfo, translationKey: BackendTranslationKeys) {
    const profile = typeof actingUserInfo.user?.profile === 'object' ? (actingUserInfo.user.profile as ProfileWithLanguage) : undefined;
    const translate = BackendTranslator.getTranslatorForProfile(profile);
    return createMyForbiddenError(translate(translationKey, { marker: SystemDashboardHelper.SYSTEM_NAME_SUFFIX }));
  }

  /** The names of those dashboards among the given ids that are system dashboards. */
  async function getSystemDashboardNames(myDatabaseHelper: MyDatabaseHelper, dashboardIds: string[]): Promise<string[]> {
    if (dashboardIds.length === 0) {
      return [];
    }
    try {
      const dashboards = await myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.DirectusDashboards>(CollectionNames.DASHBOARDS).readByQuery({
        filter: { id: { _in: dashboardIds } },
        fields: ['id', 'name'],
        limit: -1,
      });
      return dashboards.map(dashboard => dashboard.name ?? '').filter(name => SystemDashboardHelper.isSystemDashboardName(name));
    } catch (error) {
      // Fail open: a protection feature must never make the backend unusable.
      apiContext.logger.warn(`${HOOK_NAME}: could not read the dashboards: ${error}`);
      return [];
    }
  }

  async function getDashboardIdsOfPanels(myDatabaseHelper: MyDatabaseHelper, panelIds: string[]): Promise<string[]> {
    if (panelIds.length === 0) {
      return [];
    }
    try {
      const panels = await myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.DirectusPanels>(CollectionNames.PANELS).readByQuery({
        filter: { id: { _in: panelIds } },
        fields: ['id', 'dashboard'],
        limit: -1,
      });
      return panels.map(panel => panel.dashboard).filter((dashboardId): dashboardId is string => typeof dashboardId === 'string');
    } catch (error) {
      apiContext.logger.warn(`${HOOK_NAME}: could not read the dashboards of the panels: ${error}`);
      return [];
    }
  }

  async function assertDashboardsAreEditable(dashboardIds: string[], myDatabaseHelper: MyDatabaseHelper, actingUserInfo: ActingUserInfo) {
    if (dashboardIds.length === 0 || !isProtectionActiveFor(actingUserInfo)) {
      return;
    }

    const systemDashboardNames = await getSystemDashboardNames(myDatabaseHelper, dashboardIds);
    if (systemDashboardNames.length === 0) {
      return;
    }

    apiContext.logger.info(`${HOOK_NAME}: blocked change on system dashboard(s): ${systemDashboardNames.join(', ')}`);
    throw buildForbiddenError(actingUserInfo, BackendTranslationKeys.dashboard_system_edit_forbidden);
  }

  /**
   * Panels are protected through their dashboard: they may not be changed inside a system
   * dashboard, and they may not be moved into one.
   */
  async function assertPanelsAreEditable(panelIds: string[], targetDashboardIds: string[], myDatabaseHelper: MyDatabaseHelper, actingUserInfo: ActingUserInfo) {
    if (panelIds.length === 0 && targetDashboardIds.length === 0) {
      return;
    }
    if (!isProtectionActiveFor(actingUserInfo)) {
      return;
    }

    const dashboardIds = [...targetDashboardIds, ...(await getDashboardIdsOfPanels(myDatabaseHelper, panelIds))];
    const systemDashboardNames = await getSystemDashboardNames(myDatabaseHelper, dashboardIds);
    if (systemDashboardNames.length === 0) {
      return;
    }

    apiContext.logger.info(`${HOOK_NAME}: blocked change on panel(s) of system dashboard(s): ${systemDashboardNames.join(', ')}`);
    throw buildForbiddenError(actingUserInfo, BackendTranslationKeys.dashboard_system_panel_edit_forbidden);
  }

  function getDashboardIdOfPanelPayload(payload: Partial<DatabaseTypes.DirectusPanels>): string[] {
    return typeof payload?.dashboard === 'string' ? [payload.dashboard] : [];
  }

  filter(EventHelper.DASHBOARDS_CREATE_EVENT, async (input, _meta, eventContext: MyEventContext) => {
    const payload = input as Partial<DatabaseTypes.DirectusDashboards>;
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const actingUserInfo = await getActingUserInfo(myDatabaseHelper, eventContext?.accountability);

    // Everything the ADMIN_EMAIL user creates is meant to be shipped, so it is marked right away.
    if (actingUserInfo.isAdminEmailUser) {
      payload.name = SystemDashboardHelper.withSystemSuffix(payload.name);
      return payload;
    }

    // Nobody else may create a dashboard that looks like a system dashboard - they would lock
    // themselves out of their own dashboard.
    if (isProtectionActiveFor(actingUserInfo) && SystemDashboardHelper.isSystemDashboardName(payload.name)) {
      apiContext.logger.info(`${HOOK_NAME}: removed the system marker from a new dashboard: ${payload.name}`);
      payload.name = SystemDashboardHelper.withoutSystemSuffix(payload.name);
    }
    return payload;
  });

  filter(EventHelper.DASHBOARDS_UPDATE_EVENT, async (input, meta, eventContext: MyEventContext) => {
    const payload = input as Partial<DatabaseTypes.DirectusDashboards>;
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const actingUserInfo = await getActingUserInfo(myDatabaseHelper, eventContext?.accountability);

    await assertDashboardsAreEditable(getKeysFromMeta(meta), myDatabaseHelper, actingUserInfo);

    // Renaming an own dashboard into a system dashboard is not allowed either.
    if (payload.name !== undefined && isProtectionActiveFor(actingUserInfo) && SystemDashboardHelper.isSystemDashboardName(payload.name)) {
      apiContext.logger.info(`${HOOK_NAME}: removed the system marker from a renamed dashboard: ${payload.name}`);
      payload.name = SystemDashboardHelper.withoutSystemSuffix(payload.name);
    }
    return payload;
  });

  filter(EventHelper.DASHBOARDS_DELETE_EVENT, async (input, _meta, eventContext: MyEventContext) => {
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const actingUserInfo = await getActingUserInfo(myDatabaseHelper, eventContext?.accountability);

    await assertDashboardsAreEditable(toKeyList(input), myDatabaseHelper, actingUserInfo);
    return input;
  });

  filter(EventHelper.PANELS_CREATE_EVENT, async (input, _meta, eventContext: MyEventContext) => {
    const payload = input as Partial<DatabaseTypes.DirectusPanels>;
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const actingUserInfo = await getActingUserInfo(myDatabaseHelper, eventContext?.accountability);

    await assertPanelsAreEditable([], getDashboardIdOfPanelPayload(payload), myDatabaseHelper, actingUserInfo);
    return input;
  });

  filter(EventHelper.PANELS_UPDATE_EVENT, async (input, meta, eventContext: MyEventContext) => {
    const payload = input as Partial<DatabaseTypes.DirectusPanels>;
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const actingUserInfo = await getActingUserInfo(myDatabaseHelper, eventContext?.accountability);

    await assertPanelsAreEditable(getKeysFromMeta(meta), getDashboardIdOfPanelPayload(payload), myDatabaseHelper, actingUserInfo);
    return input;
  });

  filter(EventHelper.PANELS_DELETE_EVENT, async (input, _meta, eventContext: MyEventContext) => {
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const actingUserInfo = await getActingUserInfo(myDatabaseHelper, eventContext?.accountability);

    await assertPanelsAreEditable(toKeyList(input), [], myDatabaseHelper, actingUserInfo);
    return input;
  });
});
