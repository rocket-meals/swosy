/**
 * university-affiliation-hook – remembers the status a university login reports.
 *
 * On every login with an OpenID provider Directus emits `auth.create` (new user) or `auth.update`
 * (known user) with the claims of the login in `meta.providerPayload.userInfo`. The hook stores
 * `eduperson_scoped_affiliation` from them, see `UniversityAffiliationHelper`. It changes nothing
 * about the user and never blocks a login.
 *
 * Right after the login (`auth.login`) it writes the anonymous usage event
 * `university_status_confirmed` – only when the university reported student or staff status, once
 * per login, without user or profile. Its payload is the answer of `GET /university-affiliation`. So the backend shows whether the status check works at all,
 * without an app release. Off when the event is not ticked in `app_settings.app_usage_events_enabled`.
 */

import { isAppUsageEventEnabled } from 'repo-depkit-common';
import { BACKEND_USAGE_EVENT_NAME_UNIVERSITY_STATUS_CONFIRMED, BackendUsageEventHelper } from '../helpers/BackendUsageEventHelper';
import { ItemsServiceCreator } from '../helpers/ItemsServiceCreator';
import { AppSettingsHelper } from '../helpers/itemServiceHelpers/AppSettingsHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { UniversityAffiliationHelper } from '../helpers/UniversityAffiliationHelper';

const HOOK_NAME = 'university_affiliation_hook';

/** Only university logins carry the affiliation. Apple and Google never do. */
const PROVIDERS = ['dfn'];

/** Not part of `CollectionNames`: adding it there would make every hook wait for this table. */
const APP_USAGE_EVENTS = 'app_usage_events';

type AuthMeta = {
  identifier?: string;
  provider?: string;
  providerPayload?: { userInfo?: Record<string, unknown> };
};

async function remember(meta: AuthMeta) {
  const provider = meta?.provider;
  const identifier = meta?.identifier;
  if (!provider || !identifier || !PROVIDERS.includes(provider)) {
    return;
  }
  try {
    const record = UniversityAffiliationHelper.createRecord(provider, meta.providerPayload?.userInfo);
    await UniversityAffiliationHelper.save(identifier, record);
  } catch (error) {
    console.error(HOOK_NAME + ': could not store the affiliation', error);
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, ({ filter, action }, apiContext) => {
  filter('auth.create', async (payload, meta) => {
    await remember(meta as AuthMeta);
    return payload;
  });

  filter('auth.update', async (payload, meta) => {
    await remember(meta as AuthMeta);
    return payload;
  });

  action('auth.login', async (meta: { user?: string; provider?: string; status?: string }) => {
    try {
      if (meta?.status !== 'success' || !meta.user || !meta.provider || !PROVIDERS.includes(meta.provider)) {
        return;
      }
      const user = await apiContext.database('directus_users').select('external_identifier').where({ id: meta.user }).first();
      const record = user?.external_identifier ? await UniversityAffiliationHelper.load(meta.provider, user.external_identifier) : null;
      if (!record) {
        return;
      }
      const universityAffiliation = UniversityAffiliationHelper.toResponse(meta.provider, record);
      if (!universityAffiliation.is_student && !universityAffiliation.is_employee) {
        return;
      }
      const appSettings = await new AppSettingsHelper(apiContext).getAppSettings();
      if (!isAppUsageEventEnabled(appSettings?.app_usage_events_enabled, BACKEND_USAGE_EVENT_NAME_UNIVERSITY_STATUS_CONFIRMED)) {
        return;
      }
      const itemsService = await new ItemsServiceCreator(apiContext).getItemsService(APP_USAGE_EVENTS);
      await itemsService.createOne(BackendUsageEventHelper.buildUniversityStatusConfirmedEvent(universityAffiliation, new Date()), { emitEvents: false });
    } catch (error) {
      // Counting must never disturb the login.
      apiContext.logger.warn(`${HOOK_NAME}: could not write the usage event: ${String(error)}`);
    }
  });
});
