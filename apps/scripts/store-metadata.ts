import * as fs from 'node:fs';
import * as path from 'node:path';
import { EXPO_ASC_ISSUER_ID, EXPO_ASC_KEY_ID, StoreAppMetadata } from 'repo-depkit-common';
import { createAppStoreConnectToken } from './asc-api';
import { applyApplePush, planApplePush, pullAppleMetadata } from './store-metadata-apple';
import { formatChanges, slugifyDisplayName } from './store-metadata-diff';
import { applyGooglePush, createGooglePlayAccessToken, hasGooglePlayCredentials, planGooglePush, pullGoogleMetadata } from './store-metadata-google';
import { REPO_ROOT, filterStoreMetadata, loadStoreMetadataModule } from './store-metadata-load';

// CLI for syncing app store metadata ("App-Informationen") with the ground truth that
// every app defines in its store-metadata.ts. See packages/common/src/StoreAppMetadata.ts.
//
// Usage (from the repo root, see the store-metadata:* scripts in package.json):
//   yarn workspace rocket-meals-scripts store-metadata pull --module apps/frontend/app/store-metadata.ts
//   yarn workspace rocket-meals-scripts store-metadata push --module apps/frontend/app/store-metadata.ts [--dry-run]
//
// Options:
//   --module <path>        Ground-truth module, relative to the repo root (required)
//   --store apple|google   Only sync one store (default: both)
//   --app <filter>         Only sync entries matching the filter (name/bundleId/package)
//   --dry-run              push only: show what would change, write nothing
//
// Credentials:
//   Apple:  EXPO_ASC_API_KEY_PATH (path to the .p8 key). Key id and issuer id default to
//           the values in repo-depkit-common (AppleAppStoreConfig) and can be overridden
//           via EXPO_ASC_KEY_ID / EXPO_ASC_ISSUER_ID.
//   Google: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH or GOOGLE_PLAY_SERVICE_ACCOUNT_JSON.
//
// Pull writes snapshots to reports/store-metadata/<app>.<store>.json and prints the
// drift between store and ground truth. Push writes only the drifted fields.

type CliOptions = {
  command: 'pull' | 'push';
  modulePath: string;
  store: 'apple' | 'google' | 'all';
  appFilter: string | undefined;
  dryRun: boolean;
};

function parseCliOptions(argv: string[]): CliOptions {
  const [command, ...rest] = argv;
  if (command !== 'pull' && command !== 'push') {
    throw new Error(`Unbekanntes Kommando "${command ?? ''}" - erwartet "pull" oder "push".`);
  }

  let modulePath: string | undefined;
  let store: CliOptions['store'] = 'all';
  let appFilter: string | undefined;
  let dryRun = false;

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === '--module') {
      modulePath = rest[++i];
    } else if (arg === '--store') {
      const value = rest[++i];
      if (value !== 'apple' && value !== 'google') {
        throw new Error(`--store erwartet "apple" oder "google", nicht "${value}".`);
      }
      store = value;
    } else if (arg === '--app') {
      appFilter = rest[++i];
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else {
      throw new Error(`Unbekannte Option "${arg}".`);
    }
  }

  if (!modulePath) {
    throw new Error('Option --module <pfad/zur/store-metadata.ts> fehlt.');
  }

  return { command, modulePath, store, appFilter, dryRun };
}

const REPORT_DIR = path.join(REPO_ROOT, 'reports', 'store-metadata');

function writeReport(displayName: string, store: 'apple' | 'google', snapshot: unknown): string {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `${slugifyDisplayName(displayName)}.${store}.json`);
  fs.writeFileSync(reportPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  return path.relative(REPO_ROOT, reportPath);
}

// Missing credentials only skip a store when the user asked for "both" (default) - an
// explicit --store apple/google must fail loudly instead.
function resolveAppleToken(options: CliOptions): string | undefined {
  const keyPath = process.env.EXPO_ASC_API_KEY_PATH;
  if (!keyPath) {
    if (options.store === 'apple') {
      throw new Error('EXPO_ASC_API_KEY_PATH ist nicht gesetzt (Pfad zum App Store Connect .p8 Key).');
    }
    console.log('⚠️ Apple wird übersprungen: EXPO_ASC_API_KEY_PATH ist nicht gesetzt.\n');
    return undefined;
  }
  const keyId = process.env.EXPO_ASC_KEY_ID ?? EXPO_ASC_KEY_ID;
  const issuerId = process.env.EXPO_ASC_ISSUER_ID ?? EXPO_ASC_ISSUER_ID;
  return createAppStoreConnectToken(keyId, issuerId, keyPath);
}

async function resolveGoogleToken(options: CliOptions): Promise<string | undefined> {
  if (!hasGooglePlayCredentials()) {
    if (options.store === 'google') {
      throw new Error('Weder GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH noch GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ist gesetzt.');
    }
    console.log('⚠️ Google wird übersprungen: Kein Play-Service-Account konfiguriert (GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH).\n');
    return undefined;
  }
  return await createGooglePlayAccessToken();
}

async function handleApple(options: CliOptions, appleToken: string, entry: StoreAppMetadata): Promise<void> {
  if (!entry.apple) {
    return;
  }
  console.log(`🍎 Apple (${entry.apple.bundleId}):`);
  const current = await pullAppleMetadata(appleToken, entry.apple);
  const plan = planApplePush(current, entry.apple);

  if (options.command === 'pull') {
    const reportPath = writeReport(entry.displayName, 'apple', current);
    console.log(`   Name: ${current.name}, Altersfreigabe: ${current.appStoreAgeRating ?? 'unbekannt'}, Content Rights: ${current.contentRightsDeclaration ?? 'unbekannt'}`);
    for (const appInfo of current.appInfos) {
      console.log(`   AppInfo ${appInfo.appInfoId} (${appInfo.state}${appInfo.editable ? ', bearbeitbar' : ''}): Kategorie ${appInfo.primaryCategoryId ?? '-'}`);
    }
    const driftedChanges = [...plan.ageRatingChanges, ...plan.categoryChanges, ...plan.contentRightsChanges];
    if (driftedChanges.length > 0) {
      console.log(`   ⚠️ Abweichungen zur Ground Truth (Store -> Soll):\n${formatChanges(driftedChanges, '      ')}`);
    } else {
      console.log('   ✅ Store entspricht der Ground Truth.');
    }
    console.log(`   💾 Snapshot: ${reportPath}\n`);
    return;
  }

  await applyApplePush(appleToken, plan, options.dryRun);
  console.log('');
}

async function handleGoogle(options: CliOptions, googleToken: string, entry: StoreAppMetadata): Promise<void> {
  if (!entry.google) {
    return;
  }
  console.log(`🤖 Google Play (${entry.google.packageName}):`);
  const current = await pullGoogleMetadata(googleToken, entry.google);
  const plan = planGooglePush(current, entry.google);

  if (options.command === 'pull') {
    const reportPath = writeReport(entry.displayName, 'google', current);
    console.log(`   Standardsprache: ${current.details.defaultLanguage ?? '-'}, Kontakt: ${current.details.contactEmail ?? '-'}`);
    for (const listing of current.listings) {
      console.log(`   Listing ${listing.language}: "${listing.title ?? ''}"`);
    }
    const driftedChanges = [...plan.detailsChanges, ...plan.listingChanges.flatMap(listing => listing.changes)];
    if (driftedChanges.length > 0) {
      console.log(`   ⚠️ Abweichungen zur Ground Truth (Store -> Soll):\n${formatChanges(driftedChanges, '      ')}`);
    } else {
      console.log('   ✅ Store entspricht der Ground Truth.');
    }
    console.log(`   💾 Snapshot: ${reportPath}\n`);
    return;
  }

  await applyGooglePush(googleToken, entry.google, plan, options.dryRun);
  console.log('');
}

async function main(): Promise<void> {
  const options = parseCliOptions(process.argv.slice(2));
  const metadata = filterStoreMetadata(loadStoreMetadataModule(options.modulePath), options.appFilter);

  console.log(`📦 Ground Truth: ${options.modulePath} (${metadata.length} App(s))`);
  console.log(`🛠️ Kommando: ${options.command}${options.dryRun ? ' (dry-run)' : ''}, Stores: ${options.store}\n`);

  const wantsApple = options.store !== 'google' && metadata.some(entry => entry.apple);
  const wantsGoogle = options.store !== 'apple' && metadata.some(entry => entry.google);
  const appleToken = wantsApple ? resolveAppleToken(options) : undefined;
  const googleToken = wantsGoogle ? await resolveGoogleToken(options) : undefined;

  const failures: string[] = [];
  for (const entry of metadata) {
    console.log(`===== ${entry.displayName} =====`);
    if (appleToken && entry.apple) {
      try {
        await handleApple(options, appleToken, entry);
      } catch (error) {
        failures.push(`${entry.displayName} (Apple): ${error instanceof Error ? error.message : String(error)}`);
        console.error(`   ❌ ${error instanceof Error ? error.message : error}\n`);
      }
    }
    if (googleToken && entry.google) {
      try {
        await handleGoogle(options, googleToken, entry);
      } catch (error) {
        failures.push(`${entry.displayName} (Google): ${error instanceof Error ? error.message : String(error)}`);
        console.error(`   ❌ ${error instanceof Error ? error.message : error}\n`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`Fehler bei ${failures.length} Sync-Schritt(en):\n- ${failures.join('\n- ')}`);
  }
  console.log('🎉 Fertig.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
