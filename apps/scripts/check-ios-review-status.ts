import * as fs from 'node:fs';
import { JsonApiResource, asArray, ascRequest, createAppStoreConnectToken, findAppId, readRequiredEnv } from './asc-api';

// Daily App Review status check. Exit code semantics for CI:
// - Apple (or the developer) rejected a version           -> exit 1 (red run = action needed)
// - a version is approved and waits for the manual release -> exit 0 with a loud hint
// - anything else (in review, released, draft, ...)        -> exit 0, nothing to do

// https://developer.apple.com/documentation/appstoreconnectapi/appstoreversionstate
const REJECTED_APP_VERSION_STATES = new Set(['REJECTED', 'METADATA_REJECTED', 'DEVELOPER_REJECTED', 'INVALID_BINARY']);
const RELEASABLE_APP_VERSION_STATES = new Set(['PENDING_DEVELOPER_RELEASE']);

function versionState(version: JsonApiResource): string {
  return (version.attributes?.appStoreState as string) ?? 'UNKNOWN';
}

function versionString(version: JsonApiResource): string {
  return (version.attributes?.versionString as string) ?? '?';
}

function appendStepSummary(lines: string[]): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  fs.appendFileSync(summaryPath, lines.join('\n') + '\n');
}

async function main(): Promise<void> {
  const bundleId = readRequiredEnv('IOS_BUNDLE_ID');
  const keyId = readRequiredEnv('EXPO_ASC_KEY_ID');
  const issuerId = readRequiredEnv('EXPO_ASC_ISSUER_ID');
  const privateKeyPath = readRequiredEnv('EXPO_ASC_API_KEY_PATH');

  const token = createAppStoreConnectToken(keyId, issuerId, privateKeyPath);

  console.log(`🔍 Suche App mit bundleId "${bundleId}" ...`);
  const appId = await findAppId(token, bundleId);
  console.log(`✅ App gefunden (id: ${appId})\n`);

  const versionsQuery = new URLSearchParams({ 'filter[platform]': 'IOS' });
  const versionsDoc = await ascRequest(token, 'GET', `/apps/${appId}/appStoreVersions?${versionsQuery}`);
  const versions = asArray(versionsDoc.data);

  const submissionsQuery = new URLSearchParams({ 'filter[app]': appId, 'filter[platform]': 'IOS' });
  const submissionsDoc = await ascRequest(token, 'GET', `/reviewSubmissions?${submissionsQuery}`);
  const submissions = asArray(submissionsDoc.data);

  console.log('📋 App Store Versionen:');
  for (const version of versions) {
    console.log(`   - ${versionString(version)}: ${versionState(version)}`);
  }
  if (versions.length === 0) {
    console.log('   (keine)');
  }

  console.log('📋 Review-Einreichungen:');
  for (const submission of submissions) {
    console.log(`   - ${submission.id}: ${submission.attributes?.state}`);
  }
  if (submissions.length === 0) {
    console.log('   (keine)');
  }
  console.log('');

  appendStepSummary([
    `### 🍎 App Review Status: \`${bundleId}\``,
    '',
    '| App Store Version | Status |',
    '| --- | --- |',
    ...versions.map(v => `| ${versionString(v)} | \`${versionState(v)}\` |`),
    ...(versions.length === 0 ? ['| _keine_ | - |'] : []),
    '',
  ]);

  const rejected = versions.filter(v => REJECTED_APP_VERSION_STATES.has(versionState(v)));
  if (rejected.length > 0) {
    const details = rejected.map(v => `${versionString(v)} (${versionState(v)})`).join(', ');
    appendStepSummary([`❌ **Abgelehnt / Aktion erforderlich:** ${details}`, '']);
    console.error(
      `❌ Version(en) wurden abgelehnt oder benötigen manuelle Aktion: ${details}\n` +
        '   Bitte in App Store Connect prüfen und nach der Korrektur manuell per workflow_dispatch neu einreichen.'
    );
    process.exit(1);
  }

  const releasable = versions.filter(v => RELEASABLE_APP_VERSION_STATES.has(versionState(v)));
  if (releasable.length > 0) {
    const details = releasable.map(v => versionString(v)).join(', ');
    appendStepSummary([`🎉 **Freigegeben - kann veröffentlicht werden:** ${details}`, '']);
    console.log(
      `🎉 Version(en) ${details} wurden von Apple freigegeben und können in App Store Connect veröffentlicht werden.`
    );
    return;
  }

  appendStepSummary(['⏭️ Keine Aktion erforderlich.', '']);
  console.log('⏭️ Keine Aktion erforderlich - keine Ablehnung und nichts zur Veröffentlichung bereit.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
