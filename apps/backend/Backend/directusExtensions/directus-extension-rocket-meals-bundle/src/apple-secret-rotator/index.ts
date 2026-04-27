import {defineHook} from '@directus/extensions-sdk';
import {ActionInitFilterEventHelper} from "../helpers/ActionInitFilterEventHelper";
import fs from 'node:fs';

const HOOK_NAME = 'apple-secret-rotator-hook';

/**
 * Reads a value from the host .env file (mounted volume).
 * This is necessary because Docker env_file values are only loaded at container creation time,
 * not on restart. By reading directly from the mounted file, we always get the latest value.
 */
function readEnvValueFromHostFile(hostEnvFilePath: string, key: string): string | null {
  try {
    const content = fs.readFileSync(hostEnvFilePath, 'utf8');
    const lines = content.split('\n');
    const targetLine = lines.find((line) => line.match(new RegExp(`^${key}=`)));
    if (targetLine) {
      const value = targetLine.substring(key.length + 1) || '';
      return value;
    }
  } catch (error) {
    console.warn(`[${HOOK_NAME}] Could not read ${key} from ${hostEnvFilePath}:`, error);
  }
  return null;
}

export default defineHook(async ({ filter, action, init, schedule }, apiContext) => {
  init(ActionInitFilterEventHelper.CLI_INIT_BEFORE, async () => {
    const hostEnvFilePath = process.env.HOST_ENV_FILE_PATH;
    if (!hostEnvFilePath) {
      console.log(`[${HOOK_NAME}] HOST_ENV_FILE_PATH not set, skipping host .env file read.`);
      return;
    }

    if (!fs.existsSync(hostEnvFilePath)) {
      console.log(`[${HOOK_NAME}] Host .env file not found at ${hostEnvFilePath}, skipping.`);
      return;
    }

    // Read the latest AUTH_APPLE_CLIENT_SECRET from the mounted host .env file
    // This ensures we use the latest secret even after a docker restart
    // (docker restart does NOT reload env_file values, only docker compose recreate does)
    const freshSecret = readEnvValueFromHostFile(hostEnvFilePath, 'AUTH_APPLE_CLIENT_SECRET');
    if (freshSecret) {
      const currentSecret = process.env.AUTH_APPLE_CLIENT_SECRET;
      if (currentSecret !== freshSecret) {
        console.log(`[${HOOK_NAME}] AUTH_APPLE_CLIENT_SECRET from host .env differs from process.env. Updating process.env to use the latest value.`);
        process.env.AUTH_APPLE_CLIENT_SECRET = freshSecret;
      } else {
        console.log(`[${HOOK_NAME}] AUTH_APPLE_CLIENT_SECRET is already up to date.`);
      }
    } else {
      console.log(`[${HOOK_NAME}] No AUTH_APPLE_CLIENT_SECRET found in host .env file.`);
    }
  });
});
