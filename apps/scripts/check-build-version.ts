import * as fs from 'node:fs';

type EasBuildListEntry = {
  status?: string;
  appBuildVersion?: string | number | null;
};

// Extracts the build number from config.ts (see getBuildNumber() there).
export function extractLocalBuildNumber(configContent: string): number | null {
  const match = configContent.match(/function\s+getBuildNumber\s*\(\)[^{]*\{[\s\S]*?return\s+(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// The list from `eas build:list --json` is sorted newest first; the first entry
// with a parseable appBuildVersion is the build number currently online.
export function extractOnlineBuildNumber(buildList: unknown): number | null {
  const builds: unknown[] = Array.isArray(buildList) ? buildList : [buildList];
  for (const entry of builds) {
    const version = (entry as EasBuildListEntry | null | undefined)?.appBuildVersion;
    if (version === null || version === undefined) {
      continue;
    }
    const parsed = parseInt(String(version), 10);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }
  return null;
}

// Fail open: with no online build number we rather build once too often than miss a release.
export function shouldBuild(localBuildNumber: number, onlineBuildNumber: number | null): boolean {
  if (onlineBuildNumber === null) {
    return true;
  }
  return localBuildNumber > onlineBuildNumber;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set.`);
  }
  return value;
}

function readBuildList(buildListPath: string): unknown {
  if (!fs.existsSync(buildListPath)) {
    console.log(`Build list file not found at "${buildListPath}", treating as no online builds.`);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(buildListPath, 'utf-8'));
  } catch (error) {
    console.log(`Build list at "${buildListPath}" is not valid JSON, treating as no online builds: ${error}`);
    return [];
  }
}

function runCompare(): void {
  const configPath = readRequiredEnv('CONFIG_PATH');
  const buildListPath = readRequiredEnv('BUILD_LIST_PATH');
  const githubOutput = readRequiredEnv('GITHUB_OUTPUT');

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at "${configPath}" (cwd: "${process.cwd()}").`);
  }

  const localBuildNumber = extractLocalBuildNumber(fs.readFileSync(configPath, 'utf-8'));
  if (localBuildNumber === null) {
    throw new Error(`Could not extract getBuildNumber() from "${configPath}".`);
  }

  const onlineBuildNumber = extractOnlineBuildNumber(readBuildList(buildListPath));
  const build = shouldBuild(localBuildNumber, onlineBuildNumber);

  console.log(`Local build number:  ${localBuildNumber}`);
  console.log(`Online build number: ${onlineBuildNumber === null ? 'not found' : onlineBuildNumber}`);
  console.log(build ? '✅ New build required' : '🚫 No new build required');

  fs.appendFileSync(
    githubOutput,
    `should-build=${build}\n` +
      `local-build-number=${localBuildNumber}\n` +
      `online-build-number=${onlineBuildNumber === null ? '' : onlineBuildNumber}\n`
  );
}

function main(): void {
  const command = process.argv[2];

  if (command === 'compare') {
    runCompare();
  } else {
    throw new Error(`Unknown command "${command}". Expected "compare".`);
  }
}

if (require.main === module) {
  main();
}
