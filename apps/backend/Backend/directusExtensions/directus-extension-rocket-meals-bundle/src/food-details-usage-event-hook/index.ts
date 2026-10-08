/**
 * food-details-usage-event-hook – schreibt ein anonymes Nutzungsereignis, wenn eine App die Details
 * eines Speiseangebots lädt.
 *
 * Die Detailansicht der App lädt `GET /items/foodoffers/<id>`. Nach diesem Einzelabruf legt der Hook
 * in `app_usage_events` ein Ereignis `food_details_opened` an – ohne Nutzer, ohne Profil, ohne IP.
 * Als `session_id` steht `Backend_<Jahr>_<Monat>_<Tag>` darin, damit klar ist, dass es vom Server
 * kommt (siehe `BackendUsageEventHelper`). Die Seite „Live-Puls“ zeigt es im Ticker.
 *
 * Bewusst serverseitig: es zählt sofort für alle App-Versionen und im Web, ohne App-Release.
 * Gezählt werden nur Abrufe aus den Apps – Admins und Mitarbeitende mit Zugang zur Directus-Oberfläche
 * sowie Abrufe anderer Hooks nicht. Liefert Directus die Antwort aus dem Cache (pro Nutzer, `CACHE_TTL`),
 * läuft der Hook nicht. Zusätzlich zählt derselbe Nutzer (bzw. dieselbe IP ohne Login) dasselbe Angebot
 * innerhalb einer Minute nur einmal: die Detailansicht der App liest `/items/foodoffers/<id>` beim
 * Öffnen mehrfach (Details, Labels, Komponenten), ohne Sperre würde jedes Öffnen doppelt zählen.
 * Die Sperre liegt in Redis (`REDIS`), damit sie über alle Directus-Replicas gilt: der Load Balancer
 * verteilt die Abrufe eines Öffnens auf verschiedene Instanzen. Ohne Redis gilt sie nur pro Prozess.
 */

import { defineHook } from '@directus/extensions-sdk';
import Redis from 'ioredis';
import { CollectionNames } from 'repo-depkit-common';
import { BackendUsageEventDeduplicator, BackendUsageEventHelper, BackendUsageEventSharedDeduplicator, FoodofferForUsageEvent } from '../helpers/BackendUsageEventHelper';
import { ItemsServiceCreator } from '../helpers/ItemsServiceCreator';

const HOOK_NAME = 'food-details-usage-event-hook';

/** Not part of `CollectionNames`: adding it there would make every hook wait for this table. */
const APP_USAGE_EVENTS = 'app_usage_events';

export default defineHook(({ action }, apiContext) => {
  const redisUrl = apiContext.env?.['REDIS'];
  const deduplicator =
    typeof redisUrl === 'string' && redisUrl.length > 0
      ? new BackendUsageEventSharedDeduplicator(new Redis(redisUrl, { maxRetriesPerRequest: 1 }))
      : new BackendUsageEventDeduplicator();

  action(`${CollectionNames.FOODOFFERS}.items.read`, async (meta, eventContext) => {
    try {
      if (!BackendUsageEventHelper.isAppRequest(eventContext?.accountability)) {
        return;
      }
      const foodofferId = BackendUsageEventHelper.getSingleReadKey(meta?.query);
      if (!foodofferId) {
        return;
      }
      if (!(await deduplicator.shouldCount(BackendUsageEventHelper.getRequesterKey(eventContext?.accountability), foodofferId, Date.now()))) {
        return;
      }
      const records = Array.isArray(meta?.payload) ? (meta.payload as FoodofferForUsageEvent[]) : [];
      const foodoffer = records.find(record => String(record?.id) === foodofferId) ?? records[0];
      const event = BackendUsageEventHelper.buildFoodDetailsOpenedEvent(foodoffer, foodofferId, new Date());

      // Own service with the database of the server, not the one of the read: the read is done,
      // its transaction may already be closed.
      const itemsService = await new ItemsServiceCreator(apiContext).getItemsService(APP_USAGE_EVENTS);
      await itemsService.createOne(event, { emitEvents: false });
    } catch (error) {
      // Counting must never disturb the app – at worst one view is missing in the statistics.
      apiContext.logger.warn(`${HOOK_NAME}: could not write the usage event: ${String(error)}`);
    }
  });
});
