/**
 * mcp-public-user-hook – legt beim Start den öffentlichen MCP-User `MCP_Public` an.
 *
 * Er hat keine Rolle und damit nur die Rechte der Public-Policy. Sein festes Token
 * (`McpAccessHelper.PUBLIC_USER_TOKEN`) zeigt die App unter `/public/mcp-instruction` jedem an,
 * der den MCP-Server ohne eigenes Konto nutzen will.
 */

import { defineHook } from '@directus/extensions-sdk';
import { ActionInitFilterEventHelper } from '../helpers/ActionInitFilterEventHelper';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { McpAccessTokenHelper } from '../helpers/McpAccessTokenHelper';

const HOOK_NAME = 'mcp-public-user-hook';

export default defineHook(async ({ init }, apiContext) => {
  init(ActionInitFilterEventHelper.INIT_APP_STARTED, async () => {
    try {
      await new McpAccessTokenHelper(new MyDatabaseHelper(apiContext)).ensurePublicUser();
    } catch (error) {
      console.error(HOOK_NAME + ': could not ensure the public MCP user', error);
    }
  });
});
