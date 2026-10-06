/**
 * mcp-access-endpoint – Tokens für den eingebauten MCP-Server von Directus (`<PUBLIC_URL>/mcp`).
 *
 * - `GET  /mcp-access/public-token` – Token des öffentlichen Users `MCP_Public` (ohne Rolle, nur
 *   Public-Rechte). Ohne Anmeldung, das Token ist kein Geheimnis.
 * - `GET  /mcp-access/my-token` – `{ has_token }`: ob der angemeldete Nutzer schon ein Token hat.
 *   Das Token selbst steht nicht in der Antwort, die App zeigt es erst auf Knopfdruck.
 * - `POST /mcp-access/my-token` – `{ token }`: das Token des angemeldeten Nutzers, wird bei Bedarf
 *   erzeugt und im Feld `token` seines `directus_users`-Eintrags gespeichert.
 *
 * Den öffentlichen User legt außerdem der `mcp-public-user-hook` beim Start an.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { McpAccessHelper, McpAccessTokenResponse, McpAccessTokenStatus } from 'repo-depkit-common';
import { ApiContext } from '../helpers/ApiContext';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { McpAccessTokenHelper } from '../helpers/McpAccessTokenHelper';

function getUserId(req: any): string | null {
  const userId = req?.accountability?.user;
  return typeof userId === 'string' && userId.length > 0 ? userId : null;
}

export default defineEndpoint({
  id: McpAccessHelper.ENDPOINT_ID,
  handler: (router, apiContext: ApiContext) => {
    router.get(McpAccessHelper.ROUTE_PUBLIC_TOKEN, async (_req: any, res: any) => {
      try {
        const tokenHelper = new McpAccessTokenHelper(new MyDatabaseHelper(apiContext));
        const response: McpAccessTokenResponse = { token: await tokenHelper.ensurePublicUserToken() };
        res.set('Cache-Control', 'no-store');
        return res.json(response);
      } catch (error) {
        console.error(McpAccessHelper.ENDPOINT_ID + ': could not read the public MCP token', error);
        return res.status(500).json({ error: 'Could not read the public MCP token.' });
      }
    });

    router.get(McpAccessHelper.ROUTE_MY_TOKEN, async (req: any, res: any) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated.' });
      }
      try {
        const tokenHelper = new McpAccessTokenHelper(new MyDatabaseHelper(apiContext));
        const response: McpAccessTokenStatus = { has_token: !!(await tokenHelper.readToken(userId)) };
        res.set('Cache-Control', 'no-store');
        return res.json(response);
      } catch (error) {
        console.error(McpAccessHelper.ENDPOINT_ID + ': could not read the MCP token status', error);
        return res.status(500).json({ error: 'Could not read the MCP token status.' });
      }
    });

    router.post(McpAccessHelper.ROUTE_MY_TOKEN, async (req: any, res: any) => {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated.' });
      }
      try {
        const tokenHelper = new McpAccessTokenHelper(new MyDatabaseHelper(apiContext));
        const response: McpAccessTokenResponse = { token: await tokenHelper.getOrCreateToken(userId) };
        res.set('Cache-Control', 'no-store');
        return res.json(response);
      } catch (error) {
        console.error(McpAccessHelper.ENDPOINT_ID + ': could not create the MCP token', error);
        return res.status(500).json({ error: 'Could not create the MCP token.' });
      }
    });
  },
});
