import * as fs from 'node:fs';

type EasBuildArtifacts = {
  applicationArchiveUrl?: string;
  buildUrl?: string;
};

type EasBuild = {
  artifacts?: EasBuildArtifacts;
};

export function extractApkUrl(buildOutput: unknown): string {
  const build = Array.isArray(buildOutput) ? buildOutput[0] : buildOutput;
  const artifacts = (build as EasBuild | undefined)?.artifacts;
  return artifacts?.applicationArchiveUrl || artifacts?.buildUrl || '';
}

export function updateReadmeApkLink(readme: string, appKey: string, appLabel: string, apkUrl: string): string | null {
  const start = `<!-- android-preview-apk:${appKey}:start -->`;
  const end = `<!-- android-preview-apk:${appKey}:end -->`;
  const startIdx = readme.indexOf(start);
  const endIdx = readme.indexOf(end);

  if (startIdx === -1 || endIdx === -1) {
    return null;
  }

  const block = `${start}\n**${appLabel}:** 📱 [Neueste Android Preview APK herunterladen](${apkUrl})\n`;
  return readme.slice(0, startIdx) + block + readme.slice(endIdx);
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set.`);
  }
  return value;
}

function runExtract(): void {
  const buildOutputPath = readRequiredEnv('BUILD_OUTPUT_PATH');
  const githubOutput = readRequiredEnv('GITHUB_OUTPUT');

  if (!fs.existsSync(buildOutputPath)) {
    throw new Error(
      `EAS build output not found at "${buildOutputPath}" (cwd: "${process.cwd()}"). ` +
        'BUILD_OUTPUT_PATH must be absolute or relative to this script\'s working directory.'
    );
  }

  const buildOutput = JSON.parse(fs.readFileSync(buildOutputPath, 'utf-8'));
  const apkUrl = extractApkUrl(buildOutput);

  if (!apkUrl) {
    console.log('No APK URL found in EAS build output.');
  }

  fs.appendFileSync(githubOutput, `apk-url=${apkUrl}\n`);
}

function runUpdateReadme(): void {
  const readmePath = readRequiredEnv('README_PATH');
  const appKey = readRequiredEnv('APP_KEY');
  const appLabel = readRequiredEnv('APP_LABEL');
  const apkUrl = readRequiredEnv('APK_URL');

  const readme = fs.readFileSync(readmePath, 'utf-8');
  const updated = updateReadmeApkLink(readme, appKey, appLabel, apkUrl);

  if (updated === null) {
    console.log(`README markers for "${appKey}" not found, skipping README update.`);
    return;
  }

  fs.writeFileSync(readmePath, updated);
  console.log(`Updated README (${appKey}) with APK link: ${apkUrl}`);
}

function main(): void {
  const command = process.argv[2];

  if (command === 'extract') {
    runExtract();
  } else if (command === 'update-readme') {
    runUpdateReadme();
  } else {
    throw new Error(`Unknown command "${command}". Expected "extract" or "update-readme".`);
  }
}

if (require.main === module) {
  main();
}
