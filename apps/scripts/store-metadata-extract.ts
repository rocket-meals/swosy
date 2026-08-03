import * as fs from 'node:fs';
import * as path from 'node:path';
import { REPO_ROOT } from './store-metadata-load';

// Converts a pulled Apple snapshot (reports/store-metadata/<app>.apple.json, created by
// "store-metadata pull") into a ready-to-paste TypeScript ground-truth block for a
// store-metadata.ts file. Usage:
//
//   yarn workspace rocket-meals-scripts store-metadata:extract reports/store-metadata/rocket-meals.apple.json

type SnapshotAppInfo = {
  state?: string;
  editable?: boolean;
  ageRatingDeclaration?: Record<string, unknown>;
  primaryCategoryId?: string;
  secondaryCategoryId?: string;
  localizations?: { locale?: string; privacyPolicyUrl?: string; privacyChoicesUrl?: string }[];
};

type Snapshot = {
  bundleId?: string;
  contentRightsDeclaration?: string;
  appInfos?: SnapshotAppInfo[];
  missingFields?: string[];
};

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return `'${value}'`;
  }
  return JSON.stringify(value);
}

// The editable AppInfo carries the answers of the current questionnaire; a read-only
// one is the fallback when no version draft exists at pull time.
export function extractGroundTruthSnippet(snapshot: Snapshot): string {
  const appInfo = snapshot.appInfos?.find(info => info.editable) ?? snapshot.appInfos?.[0];
  if (!appInfo) {
    throw new Error('Snapshot enthält keine appInfos - wurde der pull erfolgreich ausgeführt?');
  }

  const lines: string[] = [];
  lines.push(`// Extrahiert aus App Store Connect für ${snapshot.bundleId ?? 'unbekannte App'} (AppInfo-Status: ${appInfo.state ?? 'unbekannt'})`);

  const declaration = appInfo.ageRatingDeclaration ?? {};
  const answered = Object.entries(declaration).filter(([, value]) => value !== null && value !== undefined);
  const unanswered = Object.keys(declaration).filter(key => declaration[key] === null);

  lines.push('ageRatingDeclaration: {');
  for (const [key, value] of answered.sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`\t${key}: ${formatValue(value)},`);
  }
  for (const key of unanswered.sort()) {
    lines.push(`\t// ${key}: null, // ❗ in App Store Connect unbeantwortet`);
  }
  lines.push('},');

  if (appInfo.primaryCategoryId) {
    lines.push(`primaryCategoryId: '${appInfo.primaryCategoryId}',`);
  }
  if (appInfo.secondaryCategoryId) {
    lines.push(`secondaryCategoryId: '${appInfo.secondaryCategoryId}',`);
  }
  if (snapshot.contentRightsDeclaration) {
    lines.push(`contentRightsDeclaration: '${snapshot.contentRightsDeclaration}',`);
  }

  const privacyPolicyUrls = new Set((appInfo.localizations ?? []).map(localization => localization.privacyPolicyUrl).filter(Boolean));
  for (const url of privacyPolicyUrls) {
    lines.push(`privacyPolicyUrl: '${url}',${privacyPolicyUrls.size > 1 ? ' // ⚠️ unterschiedliche Werte je Sprache!' : ''}`);
  }

  return lines.join('\n');
}

function main(): void {
  const snapshotArg = process.argv[2];
  if (!snapshotArg) {
    throw new Error('Aufruf: store-metadata:extract <pfad/zum/snapshot.apple.json>');
  }
  const snapshotPath = path.isAbsolute(snapshotArg) ? snapshotArg : path.resolve(REPO_ROOT, snapshotArg);
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as Snapshot;
  console.log(extractGroundTruthSnippet(snapshot));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
