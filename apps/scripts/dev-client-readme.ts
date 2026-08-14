import * as fs from 'node:fs';

type EasBuildArtifacts = {
  applicationArchiveUrl?: string;
  buildUrl?: string;
};

type EasBuild = {
  id?: string;
  platform?: string;
  appVersion?: string;
  appBuildVersion?: string;
  artifacts?: EasBuildArtifacts;
  project?: {
    slug?: string;
    ownerAccount?: {
      name?: string;
    };
  };
};

export function readBuildOutput(filePath: string): EasBuild | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const build = Array.isArray(parsed) ? parsed[0] : parsed;
    return (build as EasBuild) ?? null;
  } catch {
    return null;
  }
}

export function getAndroidInstallUrl(build: EasBuild | null): string {
  return build?.artifacts?.applicationArchiveUrl || build?.artifacts?.buildUrl || '';
}

export type EasProjectFallback = {
  account?: string;
  slug?: string;
};

// Ad-hoc iOS builds are installed from the EAS build details page (QR code /
// install button), not from the raw .ipa artifact. `eas build --json` output
// includes the `project` info, but `eas build:list --json` (used by the
// update-readme workflow job to pick up builds from earlier/PR runs) does NOT
// - so account and slug can be supplied as a fallback (EAS_ACCOUNT_NAME /
// EAS_PROJECT_SLUG in the workflow).
export function getIosBuildPageUrl(build: EasBuild | null, fallback?: EasProjectFallback): string {
  const account = build?.project?.ownerAccount?.name || fallback?.account;
  const slug = build?.project?.slug || fallback?.slug;
  const id = build?.id;
  if (!account || !slug || !id) {
    return '';
  }
  return `https://expo.dev/accounts/${account}/projects/${slug}/builds/${id}`;
}

export function renderDevClientBlock(appLabel: string, androidBuild: EasBuild | null, iosBuild: EasBuild | null, fallback?: EasProjectFallback): string | null {
  const links: string[] = [];

  const androidUrl = getAndroidInstallUrl(androidBuild);
  if (androidUrl) {
    links.push(`🤖 [Android APK](${androidUrl})`);
  }

  const iosUrl = getIosBuildPageUrl(iosBuild, fallback);
  if (iosUrl) {
    links.push(`🍏 [iOS (Ad-hoc Install)](${iosUrl})`);
  }

  if (links.length === 0) {
    return null;
  }

  const versionSource = androidBuild ?? iosBuild;
  const version = versionSource?.appVersion ? ` v${versionSource.appVersion}` : '';

  return `**${appLabel} Dev Client${version}:** ${links.join(' · ')}`;
}

export function updateReadmeDevClientLink(readme: string, appKey: string, block: string): string | null {
  const start = `<!-- dev-client:${appKey}:start -->`;
  const end = `<!-- dev-client:${appKey}:end -->`;
  const startIdx = readme.indexOf(start);
  const endIdx = readme.indexOf(end);

  if (startIdx === -1 || endIdx === -1) {
    return null;
  }

  return readme.slice(0, startIdx) + `${start}\n${block}\n` + readme.slice(endIdx);
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set.`);
  }
  return value;
}

function runUpdateReadme(): void {
  const readmePath = readRequiredEnv('README_PATH');
  const appKey = readRequiredEnv('APP_KEY');
  const appLabel = readRequiredEnv('APP_LABEL');
  const androidBuildJsonPath = process.env.ANDROID_BUILD_JSON;
  const iosBuildJsonPath = process.env.IOS_BUILD_JSON;

  const androidBuild = androidBuildJsonPath ? readBuildOutput(androidBuildJsonPath) : null;
  const iosBuild = iosBuildJsonPath ? readBuildOutput(iosBuildJsonPath) : null;
  const fallback: EasProjectFallback = {
    account: process.env.EAS_ACCOUNT_NAME,
    slug: process.env.EAS_PROJECT_SLUG,
  };

  const block = renderDevClientBlock(appLabel, androidBuild, iosBuild, fallback);
  if (block === null) {
    console.log(`No dev client build results found for "${appKey}", skipping README update.`);
    return;
  }

  const readme = fs.readFileSync(readmePath, 'utf-8');
  const updated = updateReadmeDevClientLink(readme, appKey, block);

  if (updated === null) {
    console.log(`README markers for dev-client "${appKey}" not found, skipping README update.`);
    return;
  }

  fs.writeFileSync(readmePath, updated);
  console.log(`Updated README (${appKey}) with dev client links.`);
}

function main(): void {
  const command = process.argv[2];

  if (command === 'update-readme') {
    runUpdateReadme();
  } else {
    throw new Error(`Unknown command "${command}". Expected "update-readme".`);
  }
}

if (require.main === module) {
  main();
}
