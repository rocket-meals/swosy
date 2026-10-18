/**
 * bundle-health-endpoint – zeigt, ob das Extension-Bundle auf dem Server geladen ist.
 *
 * `GET /rocket-meals-bundle-health` antwortet mit `{ status: "ok", ... }`. Kommt stattdessen
 * ROUTE_NOT_FOUND, hat Directus das Bundle nicht geladen – dann fehlen auch alle Hooks und alle
 * anderen Endpoints des Bundles. Der Grund steht im Log des Directus-Containers.
 *
 * Absichtlich ohne Anmeldung und ohne Datenbankzugriff: Die Route soll auch dann antworten,
 * wenn sonst nichts funktioniert, und gibt nichts preis außer dem Startzeitpunkt und dem Commit.
 *
 * `source_commit` ist der Commit, aus dem die `dist` gebaut wurde (siehe `BuildInfo`). Ist er gleich
 * `git log -1 --format=%H -- <Bundle ohne dist> packages/common packages/common-ui yarn.lock` auf
 * `master`, läuft auf dem Server der aktuelle Stand.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { BuildInfo } from './BuildInfo';

const ENDPOINT_ID = 'rocket-meals-bundle-health';

/** Wann dieses Bundle geladen wurde – ändert sich mit jedem Neustart bzw. Deploy. */
const LOADED_AT = new Date().toISOString();

export default defineEndpoint({
  id: ENDPOINT_ID,
  handler: router => {
    router.get('/', (_req: any, res: any) => {
      res.set('Cache-Control', 'no-store');
      return res.json({
        status: 'ok',
        bundle: 'directus-extension-rocket-meals-bundle',
        loaded_at: LOADED_AT,
        source_commit: BuildInfo.sourceCommit,
        source_commit_date: BuildInfo.sourceCommitDate,
      });
    });
  },
});
