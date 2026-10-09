/**
 * apartments-free-notify-hook – push notification to every profile that switched on
 * `notifiy_on_free_apartments` when apartments get free rooms (`apartments.available_from` gets a
 * date), whether from the housing sync or from an edit in Directus.
 *
 * The filter (before the update) remembers which apartments become free, the action (after it)
 * queues them. The queue waits {@link SEND_DELAY_MS} after the last change, so a sync run that frees
 * several apartments sends one notification instead of one per apartment.
 */
import { CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { MyDatabaseHelper, MyEventContext } from '../helpers/MyDatabaseHelper';
import { HookKeysHelper, HookMetaWithKeys } from '../helpers/HookKeysHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { FreeApartmentsNotifier } from './FreeApartmentsNotifier';

const HOOK_NAME = 'apartments-free-notify-hook';
const APARTMENTS = CollectionNames.APARTMENTS;
const SEND_DELAY_MS = 60 * 1000;

/** Apartment ids that become free with an update, kept from the filter to the action. */
const pendingFreeByUpdate = new Map<string, string[]>();

function getPendingKey(keys: unknown[]): string {
  return keys.map(String).sort().join(',');
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, async ({ filter, action }, apiContext) => {
  const queuedApartmentIds = new Set<string>();
  let sendTimer: ReturnType<typeof setTimeout> | null = null;

  const logError = (message: string, error: unknown) => {
    apiContext.logger.error(`${HOOK_NAME}: ${message}: ${error instanceof Error ? error.message : String(error)}`);
  };

  async function sendQueued() {
    sendTimer = null;
    const apartmentIds = [...queuedApartmentIds];
    queuedApartmentIds.clear();
    try {
      const sent = await new FreeApartmentsNotifier(new MyDatabaseHelper(apiContext)).notifyAboutApartments(apartmentIds);
      apiContext.logger.info(`${HOOK_NAME}: notified ${sent} profiles about ${apartmentIds.length} free apartments`);
    } catch (error) {
      logError('could not notify about free apartments ' + apartmentIds.join(', '), error);
    }
  }

  function queue(apartmentIds: string[]) {
    if (apartmentIds.length === 0) {
      return;
    }
    apartmentIds.forEach(id => queuedApartmentIds.add(id));
    if (sendTimer) {
      clearTimeout(sendTimer);
    }
    sendTimer = setTimeout(() => void sendQueued(), SEND_DELAY_MS);
  }

  filter(APARTMENTS + '.items.update', async (input, meta, eventContext: MyEventContext) => {
    const payload = (input ?? {}) as Partial<DatabaseTypes.Apartments>;
    if (!FreeApartmentsNotifier.hasDate(payload.available_from)) {
      return input;
    }
    const keys = HookKeysHelper.getKeysFromMeta(meta as HookMetaWithKeys);
    try {
      const notifier = new FreeApartmentsNotifier(new MyDatabaseHelper(apiContext, eventContext));
      const newlyFree = FreeApartmentsNotifier.getNewlyFreeApartmentIds(await notifier.readAvailability(keys), payload);
      if (newlyFree.length > 0) {
        pendingFreeByUpdate.set(getPendingKey(keys), newlyFree);
      }
    } catch (error) {
      logError('could not check which apartments become free', error);
    }
    return input;
  });

  action(APARTMENTS + '.items.update', async meta => {
    const pendingKey = getPendingKey(HookKeysHelper.getKeysFromMeta(meta));
    const newlyFree = pendingFreeByUpdate.get(pendingKey);
    pendingFreeByUpdate.delete(pendingKey);
    queue(newlyFree ?? []);
  });

  action(APARTMENTS + '.items.create', async meta => {
    const payload = (meta.payload ?? {}) as Partial<DatabaseTypes.Apartments>;
    if (FreeApartmentsNotifier.hasDate(payload.available_from)) {
      queue(HookKeysHelper.getKeysFromMeta(meta).map(String));
    }
  });
});
