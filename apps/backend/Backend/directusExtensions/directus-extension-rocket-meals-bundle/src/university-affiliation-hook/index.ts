/**
 * university-affiliation-hook – remembers the status a university login reports.
 *
 * On every login with an OpenID provider Directus emits `auth.create` (new user) or `auth.update`
 * (known user) with the claims of the login in `meta.providerPayload.userInfo`. The hook stores
 * `eduperson_scoped_affiliation` from them, see `UniversityAffiliationHelper`. It changes nothing
 * about the user and never blocks a login.
 */

import { MyDefineHook } from '../helpers/MyDefineHook';
import { UniversityAffiliationHelper } from '../helpers/UniversityAffiliationHelper';

const HOOK_NAME = 'university_affiliation_hook';

/** Only university logins carry the affiliation. Apple and Google never do. */
const PROVIDERS = ['dfn'];

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

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, ({ filter }) => {
  filter('auth.create', async (payload, meta) => {
    await remember(meta as AuthMeta);
    return payload;
  });

  filter('auth.update', async (payload, meta) => {
    await remember(meta as AuthMeta);
    return payload;
  });
});
