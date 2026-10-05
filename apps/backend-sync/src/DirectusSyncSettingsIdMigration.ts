import { FetchIgnoreSelfSignedCertHelper } from './FetchIgnoreSelfSignedCertHelper';

// Since directus-sync 3.4.1 the settings singleton is always tracked in the id map under this
// placeholder. Older versions stored a random sync id (our dump used one) - with that, a push to a
// fresh Directus fails ("Local id already exists"), because directus-sync creates the placeholder
// entry and then can't find the dump's sync id in the next push iteration.
export const SETTINGS_SYNC_ID_PLACEHOLDER = '_sync_default_settings';

type IdMapEntry = { sync_id: string; local_id: string | number };

/**
 * Renames a legacy settings entry in the directus-sync id map to the placeholder, so that existing
 * instances and fresh ones both match the dump. Idempotent: does nothing once the placeholder exists.
 */
export async function migrateSettingsSyncIdToPlaceholder(directusUrl: string, cookie: string): Promise<void> {
  const tableUrl = `${directusUrl}/directus-extension-sync/table/settings`;
  const headers = { Cookie: cookie, 'Content-Type': 'application/json' };

  const listResponse = await FetchIgnoreSelfSignedCertHelper.fetch(tableUrl, { method: 'GET', headers });
  if (!listResponse.ok) {
    throw new Error(`Could not read the directus-sync id map for settings: ${listResponse.status} ${listResponse.statusText}`);
  }
  const entries: IdMapEntry[] = await listResponse.json();

  const legacyEntries = entries.filter(entry => entry.sync_id !== SETTINGS_SYNC_ID_PLACEHOLDER);
  if (legacyEntries.length === 0) {
    return;
  }
  const hasPlaceholder = entries.length !== legacyEntries.length;

  for (const legacyEntry of legacyEntries) {
    console.log(` -  Renaming directus-sync settings id map entry ${legacyEntry.sync_id} to ${SETTINGS_SYNC_ID_PLACEHOLDER}`);
    const deleteResponse = await FetchIgnoreSelfSignedCertHelper.fetch(`${tableUrl}/sync_id/${encodeURIComponent(legacyEntry.sync_id)}`, { method: 'DELETE', headers });
    if (!deleteResponse.ok) {
      throw new Error(`Could not remove legacy settings id map entry: ${deleteResponse.status} ${deleteResponse.statusText}`);
    }
  }

  if (!hasPlaceholder) {
    const createResponse = await FetchIgnoreSelfSignedCertHelper.fetch(tableUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ table: 'settings', sync_id: SETTINGS_SYNC_ID_PLACEHOLDER, local_id: String(legacyEntries[0]!.local_id) }),
    });
    if (!createResponse.ok) {
      throw new Error(`Could not create settings id map placeholder: ${createResponse.status} ${createResponse.statusText}`);
    }
  }
}
