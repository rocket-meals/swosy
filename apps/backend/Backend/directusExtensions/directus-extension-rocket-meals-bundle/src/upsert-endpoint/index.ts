/**
 * upsert-endpoint – legt einen Eintrag an oder aktualisiert ihn, in einem einzigen API-Aufruf.
 *
 * Portiert aus https://github.com/freekrai/directus-extension-upsert (MIT, Copyright (c) 2023 Roger Stringer),
 * siehe Issue #774. URL und Antwortformat sind gleich geblieben, damit Clients des Originals weiter funktionieren.
 *
 * `POST /upsert/:collection` mit
 * ```json
 * { "filter": { "key": "test2" }, "body": { "key": "test2", "value": "abc" } }
 * ```
 * Findet `filter` einen Eintrag, wird er mit `body` aktualisiert („Update Success“), sonst wird `body`
 * neu angelegt („Create Success“, code 201). Es gelten die Rechte des aufrufenden Nutzers: lesen für die
 * Suche, anlegen bzw. aktualisieren für das Schreiben. Details zur Logik in `UpsertHandler`.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { ApiContext } from '../helpers/ApiContext';
import { UpsertHandler } from './UpsertHandler';

const ENDPOINT_ID = 'upsert';

export default defineEndpoint({
  id: ENDPOINT_ID,
  handler: (router, apiContext: ApiContext) => {
    router.post('/:collection', async (req: any, res: any, next: any) => {
      try {
        const { collection } = req.params;
        const primaryKeyField = req.schema?.collections?.[collection]?.primary;
        if (!collection || !primaryKeyField) {
          return res.status(404).json({ success: false, msg: 'Unknown collection', code: 404, data: null });
        }

        const service = new apiContext.services.ItemsService(collection, {
          schema: req.schema,
          accountability: req.accountability,
        });

        const result = await UpsertHandler.upsert(service as any, primaryKeyField, req.body);
        return res.status(result.code).json(result);
      } catch (error) {
        return next(error);
      }
    });
  },
});
