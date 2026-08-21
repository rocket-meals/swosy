import { defineHook } from '@directus/extensions-sdk';
import { Accountability, PrimaryKey } from '@directus/types';
import { CollectionNames, DatabaseTypes, SystemDashboardHelper } from 'repo-depkit-common';
import { MyDatabaseHelper, MyEventContext } from '../helpers/MyDatabaseHelper';
import { EventHelper } from '../helpers/EventHelper';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import { createMyForbiddenError } from '../helpers/MyDirectusError';
import { HookKeysHelper } from '../helpers/HookKeysHelper';
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
  async function getSystemDashboardNames(myDatabaseHelper: MyDatabaseHelper, dashboardIds: PrimaryKey[]): Promise<string[]> {
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

  async function getDashboardIdsOfPanels(myDatabaseHelper: MyDatabaseHelper, panelIds: PrimaryKey[]): Promise<PrimaryKey[]> {
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

  /**
   * The name a dashboard of this customer carries: never the system marker, always the key of
   * their own server - as long as this instance knows which customer it belongs to.
   */
  function getCustomerDashboardName(name: string | null | undefined): string {
    const nameWithoutSystemMarker = SystemDashboardHelper.withoutSystemSuffix(name);
    if (nameWithoutSystemMarker !== (name ?? '').trim()) {
      apiContext.logger.info(`${HOOK_NAME}: removed the system marker from a dashboard of a customer: ${name}`);
    }

    const serverKey = EnvVariableHelper.getSyncForCustomer();
    if (!serverKey) {
      return nameWithoutSystemMarker;
    }
    return SystemDashboardHelper.withNameSuffix(nameWithoutSystemMarker, serverKey);
  }

  function assertNoSystemDashboards(systemDashboardNames: string[], actingUserInfo: ActingUserInfo) {
    if (systemDashboardNames.length === 0 || !isProtectionActiveFor(actingUserInfo)) {
      return;
    }

    apiContext.logger.info(`${HOOK_NAME}: blocked change on system dashboard(s): ${systemDashboardNames.join(', ')}`);
    throw buildForbiddenError(actingUserInfo, BackendTranslationKeys.dashboard_system_edit_forbidden);
  }

  async function assertDashboardsAreEditable(dashboardIds: PrimaryKey[], myDatabaseHelper: MyDatabaseHelper, actingUserInfo: ActingUserInfo) {
    if (dashboardIds.length === 0 || !isProtectionActiveFor(actingUserInfo)) {
      return;
    }
    assertNoSystemDashboards(await getSystemDashboardNames(myDatabaseHelper, dashboardIds), actingUserInfo);
  }

  /**
   * Panels are protected through their dashboard: they may not be changed inside a system
   * dashboard, and they may not be moved into one.
   */
  async function assertPanelsAreEditable(panelIds: PrimaryKey[], targetDashboardIds: PrimaryKey[], myDatabaseHelper: MyDatabaseHelper, actingUserInfo: ActingUserInfo) {
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

  function getDashboardIdOfPanelPayload(payload: Partial<DatabaseTypes.DirectusPanels>): PrimaryKey[] {
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

    if (isProtectionActiveFor(actingUserInfo)) {
      // Nobody else may create a dashboard that looks like a system dashboard - they would lock
      // themselves out of their own dashboard. It is marked with the key of their own server
      // instead, so it is visible at a glance whose dashboard it is.
      payload.name = getCustomerDashboardName(payload.name);
    }
    return payload;
  });

  filter(EventHelper.DASHBOARDS_UPDATE_EVENT, async (input, meta, eventContext: MyEventContext) => {
    const payload = input as Partial<DatabaseTypes.DirectusDashboards>;
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const actingUserInfo = await getActingUserInfo(myDatabaseHelper, eventContext?.accountability);

    const dashboardIds = HookKeysHelper.getKeysFromMeta(meta);
    const isRename = payload.name !== undefined;
    // Needed for the rename rules below even when the protection does not apply to this user.
    const systemDashboardNames = isProtectionActiveFor(actingUserInfo) || isRename ? await getSystemDashboardNames(myDatabaseHelper, dashboardIds) : [];

    assertNoSystemDashboards(systemDashboardNames, actingUserInfo);

    if (isRename) {
      if (systemDashboardNames.length > 0) {
        // A system dashboard keeps its marker: renaming it into an own dashboard would leave a
        // dashboard behind that looks editable but is still reset with every deploy.
        payload.name = SystemDashboardHelper.withSystemSuffix(payload.name);
      } else if (isProtectionActiveFor(actingUserInfo)) {
        // ... and the other way round: an own dashboard may not be renamed into a system one, and
        // keeps the key of its own server.
        payload.name = getCustomerDashboardName(payload.name);
      }
    }
    return payload;
  });

  filter(EventHelper.DASHBOARDS_DELETE_EVENT, async (input, _meta, eventContext: MyEventContext) => {
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const actingUserInfo = await getActingUserInfo(myDatabaseHelper, eventContext?.accountability);

    await assertDashboardsAreEditable(HookKeysHelper.toPrimaryKeys(input), myDatabaseHelper, actingUserInfo);
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

    await assertPanelsAreEditable(HookKeysHelper.getKeysFromMeta(meta), getDashboardIdOfPanelPayload(payload), myDatabaseHelper, actingUserInfo);
    return input;
  });

  filter(EventHelper.PANELS_DELETE_EVENT, async (input, _meta, eventContext: MyEventContext) => {
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const actingUserInfo = await getActingUserInfo(myDatabaseHelper, eventContext?.accountability);

    await assertPanelsAreEditable(HookKeysHelper.toPrimaryKeys(input), [], myDatabaseHelper, actingUserInfo);
    return input;
  });
});
