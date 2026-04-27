import {syncDatabase, SyncDataBaseOptionDockerPush} from "./SyncDatabaseSchema";
import {registerCronJob, registerShutdownJobs} from "./CronHelperManager";
import {buildConfigFromEnv, ensureAppleClientSecret} from "./apple-secret-rotator";
import {HOST_ENV_FILE_PATH} from "./apple-secret-rotator/DirectusEnvFileHelper";
import {CronHelper} from "repo-depkit-common";
import {DockerDirectusHelper} from "./DockerDirectusHelper";
import {DockerDirectusPingHelper} from "./DockerDirectusPingHelper";
import {DockerContainerManager} from "./DockerContainerManager";

async function restartDirectusIfSecretChanged(result: {changed: boolean, reason?: string}): Promise<void> {
  if(result.changed){
    console.log("[AppleClientSecretChecker] Apple client secret was refreshed. Reason:", result.reason);
    // Restart Docker containers so that the Directus hook reads the new secret from host.env
    let localDockerDirectusServerUrl = DockerDirectusHelper.getDirectusServerUrl();

    await DockerDirectusPingHelper.waitForDirectusHealthy(localDockerDirectusServerUrl);
    const restartSuccess = await DockerContainerManager.restartDirectusContainers(localDockerDirectusServerUrl as string);
    if(restartSuccess){
        console.log("[AppleClientSecretChecker] Successfully restarted Directus Docker containers to apply new Apple client secret.");
    } else {
        console.error("[AppleClientSecretChecker] Failed to restart Directus Docker containers after Apple client secret refresh.");
    }
  }
}

async function registerAppleClientSecretChecker(){
  console.log("registerAppleClientSecretChecker");

  // Initial check beim Startup
  let hostEnvFilePath = HOST_ENV_FILE_PATH;
  let config = buildConfigFromEnv(hostEnvFilePath);
  if(config){
    const result = await ensureAppleClientSecret(config, hostEnvFilePath);
    await restartDirectusIfSecretChanged(result);
  }

  // Cron job: check daily at 2 AM
  registerCronJob({
    id: 'sync-database-every-day',
    schedule: CronHelper.EVERY_DAY_AT_2AM,
    task: async () => {
        hostEnvFilePath = HOST_ENV_FILE_PATH;
        config = buildConfigFromEnv(hostEnvFilePath);
        if(config){
          console.log("[AppleClientSecretChecker] Loaded config:");
          console.log(JSON.stringify(config, null, 2));
          const result = await ensureAppleClientSecret(config, hostEnvFilePath);
          await restartDirectusIfSecretChanged(result);
        } else {
            console.warn('[AppleClientSecretChecker] Rotator disabled due to missing configuration.');
        }
    }
  });
}

async function main() {
  // start sync-database schema service
  console.log("Starting Backend-Sync Service...");

  registerShutdownJobs(); // Registriere sauberes Shutdown-Verhalten

  await registerAppleClientSecretChecker();

  console.log("Continuing with database schema sync...");

  let runSyncDatabase = true
  if (runSyncDatabase){
    console.log("Syncing database schema with Docker Push option...");
    let errors = await syncDatabase(SyncDataBaseOptionDockerPush);
    if (errors) {
      console.error('❌ Fehler beim Synchronisieren des Datenbankschemas mit Docker Push Option.');
      process.exit(1);
    }
  }

  console.log('Backend-Sync Service läuft. Cron-Jobs sind aktiv.');
  // keep process alive: never-resolving promise ist besser als while(true) für TS
  await new Promise<never>(() => {});
}

// Starte den Service
main();
