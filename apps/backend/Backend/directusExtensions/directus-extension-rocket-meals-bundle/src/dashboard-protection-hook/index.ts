import { defineHook } from '@directus/extensions-sdk';
import { Accountability, PrimaryKey } from '@directus/types';
import { CollectionNames, DashboardNameHelper, DatabaseTypes } from 'repo-depkit-common';
import { MyDatabaseHelper, MyEventContext } from '../helpers/MyDatabaseHelper';
import { EventHelper } from '../helpers/EventHelper';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import { buildServerDashboardName, buildSystemDashboardName } from '../helpers/DashboardNameRules';
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
   * System dashboards belong to the ADMIN_EMAIL user, on every instance - the test system
   * included, where they are authored. Being an administrator by role is not enough: their
   * changes would be reset with the next deploy, and on the test system they would silently end
   * up in the next release.
   *
   * Dashboards that are not marked as system dashboards stay untouched by this and are edited
   * along the usual Directus permissions.
   */
  function isProtectionActiveFor(actingUserInfo: ActingUserInfo): boolean {
    return !actingUserInfo.isAdminEmailUser;
  }

  function buildForbiddenError(actingUserInfo: ActingUserInfo, translationKey: BackendTranslationKeys) {
    const profile = typeof actingUserInfo.user?.profile === 'object' ? (actingUserInfo.user.profile as ProfileWithLanguage) : undefined;
    const translate = BackendTranslator.getTranslatorForProfile(profile);
    return createMyForbiddenError(translate(translationKey, { marker: DashboardNameHelper.SYSTEM_NAME_MARKER }));
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
      return dashboards.map(dashboard => dashboard.name ?? '').filter(name => DashboardNameHelper.isSystemDashboardName(name));
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
   * Nobody but the ADMIN_EMAIL user may name a dashboard like a shipped one. Renaming is rejected
   * instead of silently corrected, so the user learns why their name did not stick.
   */
  function assertSystemMarkerIsAllowed(name: string | null | undefined, actingUserInfo: ActingUserInfo) {
    if (!DashboardNameHelper.isSystemDashboardName(name)) {
      return;
    }

    apiContext.logger.info(`${HOOK_NAME}: blocked a name reserved for system dashboards: ${name}`);
    throw buildForbiddenError(actingUserInfo, BackendTranslationKeys.dashboard_system_marker_forbidden);
  }

  function assertNoSystemDashboards(systemDashboardNames: string[], actingUserInfo: ActingUserInfo) {
    if (systemDashboardNames.length === 0 || !isProtectionActiveFor(actingUserInfo)) {
      return;
    }

    apiContext.logger.info(`${HOOK_NAME}: blocked change on system dashboard(s): ${systemDashboardNames.join(', ')}`);
    throw buildForbiddenError(actingUserInfo, BackendTranslationKeys.dashboard_system_edit_forbidden);
  }

  /**
   * Deleting a shipped dashboard is reserved for the ADMIN_EMAIL user everywhere, the test system
   * included: it would come back with the next deploy anyway, and on the way there it takes the
   * panels of everybody else with it.
   */
  async function assertDashboardsAreDeletable(dashboardIds: PrimaryKey[], myDatabaseHelper: MyDatabaseHelper, actingUserInfo: ActingUserInfo) {
    if (dashboardIds.length === 0 || actingUserInfo.isAdminEmailUser) {
      return;
    }

    const systemDashboardNames = await getSystemDashboardNames(myDatabaseHelper, dashboardIds);
    if (systemDashboardNames.length === 0) {
      return;
    }

    apiContext.logger.info(`${HOOK_NAME}: blocked deletion of system dashboard(s): ${systemDashboardNames.join(', ')}`);
    throw buildForbiddenError(actingUserInfo, BackendTranslationKeys.dashboard_system_delete_forbidden);
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
      payload.name = buildSystemDashboardName(payload.name);
      return payload;
    }

    // Everybody else creates a dashboard of this server: it gets the key of the server it was
    // created on, and never the system marker - with that marker its owner would lock themselves
    // out of their own dashboard. A system marker is only stripped here, not rejected: a name
    // like "Mensen [System] (copy)" is what Directus hands over when somebody duplicates a system
    // dashboard, and that is a legitimate way to start an own dashboard.
    payload.name = buildServerDashboardName(payload.name, EnvVariableHelper.getSyncForCustomer());
    return payload;
  });

  filter(EventHelper.DASHBOARDS_UPDATE_EVENT, async (input, meta, eventContext: MyEventContext) => {
    const payload = input as Partial<DatabaseTypes.DirectusDashboards>;
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const actingUserInfo = await getActingUserInfo(myDatabaseHelper, eventContext?.accountability);

    if (actingUserInfo.isAdminEmailUser) {
      // Whatever the ADMIN_EMAIL user renames becomes a shipped dashboard, so they can turn
      // "App [Test]" into "App [System]" - and never leave the key of a server behind.
      if (payload.name !== undefined) {
        payload.name = buildSystemDashboardName(payload.name);
      }
      return payload;
    }

    // Everybody else may not touch a system dashboard at all - not its name, and not its color,
    // icon or note either.
    const dashboardIds = HookKeysHelper.getKeysFromMeta(meta);
    assertNoSystemDashboards(await getSystemDashboardNames(myDatabaseHelper, dashboardIds), actingUserInfo);

    if (payload.name !== undefined) {
      // What is left is a dashboard of this server, and it may not be renamed into a system one.
      assertSystemMarkerIsAllowed(payload.name, actingUserInfo);
      payload.name = buildServerDashboardName(payload.name, EnvVariableHelper.getSyncForCustomer());
    }
    return payload;
  });

  filter(EventHelper.DASHBOARDS_DELETE_EVENT, async (input, _meta, eventContext: MyEventContext) => {
    const myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    const actingUserInfo = await getActingUserInfo(myDatabaseHelper, eventContext?.accountability);

    await assertDashboardsAreDeletable(HookKeysHelper.toPrimaryKeys(input), myDatabaseHelper, actingUserInfo);
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
