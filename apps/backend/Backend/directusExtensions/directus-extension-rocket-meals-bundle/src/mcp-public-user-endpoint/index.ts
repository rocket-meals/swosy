/**
 * mcp-public-user-endpoint – stellt den öffentlichen MCP-User `MCP_Public` auf Anfrage der App sicher.
 *
 * `POST /mcp-public-user` legt den User an, falls es ihn (noch) nicht gibt, setzt Rolle, Status und
 * Token zurück wie der `mcp-public-user-hook` beim Start und antwortet mit `{ token }`. Die App zeigt
 * dieses Token in der Anleitung unter `/public/mcp-instruction` an – ändert sich das feste Token
 * (`McpAccessHelper.PUBLIC_USER_TOKEN`), stimmt die Anleitung damit trotzdem.
 *
 * Ohne Anmeldung: Das Token ist öffentlich und gibt nur die Rechte der Public-Policy. Der Aufruf ist
 * idempotent – mehr als den einen User anzulegen bzw. zurückzusetzen kann er nicht.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { McpAccessHelper } from 'repo-depkit-common';
import { ApiContext } from '../helpers/ApiContext';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { McpAccessTokenHelper } from '../helpers/McpAccessTokenHelper';

export default defineEndpoint({
  id: McpAccessHelper.PUBLIC_USER_ENDPOINT_ID,
  handler: (router, apiContext: ApiContext) => {
    router.post('/', async (_req: any, res: any) => {
      try {
        const token = await new McpAccessTokenHelper(new MyDatabaseHelper(apiContext)).ensurePublicUser();
        res.set('Cache-Control', 'no-store');
        return res.json({ token });
      } catch (error) {
        console.error(McpAccessHelper.PUBLIC_USER_ENDPOINT_ID + ': could not ensure the public MCP user', error);
        return res.status(500).json({ error: 'Could not ensure the public MCP user.' });
      }
    });
  },
});
