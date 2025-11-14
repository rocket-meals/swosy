import {defineHook} from '@directus/extensions-sdk';
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";

export default defineHook(async ({ filter, action, init, schedule }, apiContext) => {
  init(ActionInitFilterEventHelper.CLI_INIT_BEFORE, async () => {
    console.log("DIRECTUS: THE CURRENT AUTH_APPLE_CLIENT_SECRET IS:", process.env.AUTH_APPLE_CLIENT_SECRET)
  });
});
