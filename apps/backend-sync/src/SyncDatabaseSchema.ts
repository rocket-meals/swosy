import {DirectusDatabaseSync} from './DirectusDatabaseSync';
import {DockerDirectusHelper} from './DockerDirectusHelper';
import {ServerHelper} from 'repo-depkit-common';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import {DockerContainerManager} from './DockerContainerManager';
import {findEnvFile} from "./EnvFileFinder";
import {DirectusTypeDownloaderHelper} from "./DirectusTypeDownloaderHelper";

enum SyncOperation {
  NONE = 'none',
  PUSH = 'push',
  PULL = 'pull',
}

export type SyncDatabaseOptions = {
    adminEmail?: string;
    adminPassword?: string;
    directusUrl?: string;
    pathToDataDirectusSync?: string;
    dockerDirectusRestart?: boolean;
    push?: boolean;
    pull?: boolean;
    dockerPush?: boolean;
    pullFromTestSystem?: boolean;
    pushToTestSystem?: boolean;
}

export const SyncDataBaseOptionDockerPush: SyncDatabaseOptions = {
  dockerPush: true,
}

type ResolvedSyncConfig = {
  adminEmail: string | undefined;
  adminPassword: string | undefined;
  directusInstanceUrl: string | undefined;
  pathToDataDirectusSync: string | undefined;
  pathToTargetTypesFile: string | undefined;
  dockerDirectusRestart: boolean;
  syncOperation: SyncOperation;
};

async function resolveSyncConfig(options: SyncDatabaseOptions): Promise<ResolvedSyncConfig> {
  let adminEmail = options.adminEmail || process.env.ADMIN_EMAIL;
  let adminPassword = options.adminPassword || process.env.ADMIN_PASSWORD;
  let directusInstanceUrl = options.directusUrl;
  let pathToDataDirectusSync = options.pathToDataDirectusSync;
  let pathToTargetTypesFile: string | undefined;
  let dockerDirectusRestart = options.dockerDirectusRestart || false;

  let syncOperation = SyncOperation.NONE;
  if (options.push || options.dockerPush || options.pushToTestSystem) {
    syncOperation = SyncOperation.PUSH;
  }
  if (options.pull || options.pullFromTestSystem) {
    syncOperation = SyncOperation.PULL;
  }

  if (options.dockerPush) {
    dockerDirectusRestart = true;
    directusInstanceUrl = DockerDirectusHelper.getDirectusServerUrl();
    pathToDataDirectusSync = DockerDirectusHelper.getDataPathToDirectusSyncData();
  }

  if (options.pullFromTestSystem || options.pushToTestSystem) {
    directusInstanceUrl = ServerHelper.TEST_SERVER_CONFIG.server_url;
    const envFilePath = await findEnvFile();
    if (envFilePath) {
      console.log(`🔍 Gefundene .env Datei für Pull vom Testsystem: ${envFilePath}`);
      dotenv.config({ path: envFilePath });
      adminEmail = process.env.ADMIN_EMAIL;
      adminPassword = process.env.ADMIN_PASSWORD;

      if (!pathToDataDirectusSync) {
        const folderOfEnvFile = path.dirname(envFilePath);
        pathToDataDirectusSync = path.join(folderOfEnvFile, DockerDirectusHelper.getRelativePathToDirectusSyncFromProjectRoot());
        pathToTargetTypesFile = path.join(folderOfEnvFile, 'packages/common/src/databaseTypes/types.ts');
      }
    }
  }

  return { adminEmail, adminPassword, directusInstanceUrl, pathToDataDirectusSync, pathToTargetTypesFile, dockerDirectusRestart, syncOperation };
}

function validateSyncConfig(config: ResolvedSyncConfig): boolean {
  let errors = false;
  if (!config.directusInstanceUrl) {
    console.error('❌ Fehler: Directus URL muss angegeben werden (--directus-url) oder Docker Push muss aktiviert sein (--docker-push)');
    errors = true;
  }
  if (!config.pathToDataDirectusSync) {
    console.error('❌ Fehler: Pfad zu den Sync-Daten muss angegeben werden (--path-to-data-directus-sync)');
    errors = true;
  }
  if (!config.adminEmail) {
    console.error('❌ Fehler: Admin Email muss angegeben werden (--admin-email) oder über Umgebungsvariablen ADMIN_EMAIL gesetzt sein');
    errors = true;
  }
  if (!config.adminPassword) {
    console.error('❌ Fehler: Admin Password muss angegeben werden (--admin-password) oder über Umgebungsvariablen ADMIN_PASSWORD gesetzt sein');
    errors = true;
  }
  if (config.syncOperation === SyncOperation.NONE) {
    console.error('❌ Fehler: Ungültige Operation. Wählen Sie entweder --push, --pull oder --docker-push');
    errors = true;
  }
  return !errors;
}

export async function syncDatabase(options: SyncDatabaseOptions): Promise<boolean> {
  console.log("Starting Backend Sync Service...");
  console.log("Options:");
  console.log(JSON.stringify(options, null, 2));

  const config = await resolveSyncConfig(options);
  if (!validateSyncConfig(config)) {
    return false;
  }

  const { adminEmail, adminPassword, directusInstanceUrl, pathToDataDirectusSync, pathToTargetTypesFile, dockerDirectusRestart, syncOperation } = config;

  try {
    console.log('🚀 Starte Backend Sync Service...');
    console.log(`📡 Directus URL: ${directusInstanceUrl}`);

    const syncHelper = new DirectusDatabaseSync({
      directusInstanceUrl: directusInstanceUrl as string,
      adminEmail: adminEmail as string,
      adminPassword: adminPassword as string,
      pathToDataDirectusSyncData: pathToDataDirectusSync as string,
    });

    switch (syncOperation) {
      case SyncOperation.PUSH:
        console.log('🔄 Führe initiale Push-Operation durch...');
        await syncHelper.push();
        console.log('✅ Initiale Push-Operation erfolgreich abgeschlossen!');
        break;
      case SyncOperation.PULL:
        console.log('🔄 Führe initiale Pull-Operation durch...');
        await syncHelper.pull();
        console.log('✅ Initiale Pull-Operation erfolgreich abgeschlossen!');
        if (pathToTargetTypesFile) {
          console.log('🔄 Lade TypeScript-Typen herunter...');
          const typeDownloader = new DirectusTypeDownloaderHelper({
            directusInstanceUrl: directusInstanceUrl as string,
            adminEmail: adminEmail as string,
            adminPassword: adminPassword as string,
            targetTypesFilePath: pathToTargetTypesFile,
          });
          await typeDownloader.downloadTypes();
          console.log('✅ TypeScript-Typen erfolgreich heruntergeladen!');
        }
        break;
      case SyncOperation.NONE:
        break;
    }

    if (dockerDirectusRestart) {
      console.log('🔄 Starte Directus Docker Container neu...');
      const restartSuccess = await DockerContainerManager.restartDirectusContainers(directusInstanceUrl as string);
      if (restartSuccess) {
        console.log('✅ Directus Docker Container erfolgreich neu gestartet!');
      } else {
        console.error('❌ Fehler: Directus Docker Container Neustart fehlgeschlagen!');
        return false;
      }
    }

  } catch (error) {
    console.error('💥 Fehler im Backend Sync Service:', error);
    return false;
  }
  return true;
}