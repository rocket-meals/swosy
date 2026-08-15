/**
 * Collects open-source license information for an app and all of its
 * workspace dependencies (e.g. repo-depkit-common, repo-depkit-common-ui) by
 * reading each dependency's own installed package.json from node_modules -
 * no data is hand-maintained or duplicated, only normalized (license shape,
 * repository URL) so the same fields can be rendered consistently.
 *
 * Usage: require via the package subpath, not the repo-depkit-common main
 * entry (`import ... from 'repo-depkit-common'`), so it never gets pulled
 * into an app's RN/Metro bundle, only into Node-only config contexts:
 *
 *   const { collectLicenses } = require('repo-depkit-common/licenses/collectLicenses.ts');
 *
 * Call it from an app's app.config.ts (which already registers ts-node) and
 * place the result into the Expo config's `extra` field, e.g. `extra.licenses`.
 * Expo embeds `extra` into the app manifest on every config evaluation -
 * expo start, expo export, EAS build and EAS update (OTA) all evaluate
 * app.config.ts fresh - so no generated source file is needed, nothing has
 * to be committed, and an OTA update alone ships the dependency versions
 * that were installed when the update was published. `extra` is bundled as
 * a plain asset/resource file on native (not a size-limited manifest entry)
 * and fetched as part of the update manifest on OTA - keep it in the tens
 * of KB, not MB, since that manifest is fetched on every app launch/update
 * check. A license list for ~100 packages serializes to ~15-20 KB, which is
 * negligible.
 *
 * Node-only code (fs/path) - never import this from app/runtime code.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export type LicenseEntry = {
	name: string;
	version: string;
	license: string;
	repository?: string;
	licenseUrl?: string;
};

type PackageJsonRepository = string | { url?: string; directory?: string };

type PackageJson = {
	version?: string;
	license?: string | { type?: string };
	licenses?: Array<string | { type?: string }>;
	repository?: PackageJsonRepository;
	homepage?: string;
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

const WORKSPACE_PROTOCOL = 'workspace:';
const LICENSE_FILE_PATTERN = /^(licen[cs]e|copying)(\.(md|txt|markdown))?$/i;

function readJson(filePath: string): PackageJson {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Resolve the directory of an installed package by walking up the
 * node_modules chain starting at `startDir` (handles hoisting in the
 * yarn workspace monorepo).
 */
function findInstalledPackageDir(name: string, startDir: string): string | null {
	let dir = startDir;
	for (;;) {
		const candidate = path.join(dir, 'node_modules', ...name.split('/'));
		if (fs.existsSync(path.join(candidate, 'package.json'))) {
			return candidate;
		}
		const parent = path.dirname(dir);
		if (parent === dir) {
			return null;
		}
		dir = parent;
	}
}

/**
 * Collect the union of direct dependencies (dependencies + peerDependencies)
 * of the app and of every workspace package it depends on, recursively.
 * Workspace packages themselves are followed but not reported.
 */
function collectDirectDependencyNames(appDir: string): Set<string> {
	const names = new Set<string>();
	const visitedPackageJsons = new Set<string>();
	const queue = [appDir];

	while (queue.length > 0) {
		const dir = queue.pop() as string;
		const packageJsonPath = path.join(dir, 'package.json');
		if (visitedPackageJsons.has(packageJsonPath)) {
			continue;
		}
		visitedPackageJsons.add(packageJsonPath);

		let pkg: PackageJson;
		try {
			pkg = readJson(packageJsonPath);
		} catch {
			continue;
		}

		const declared = { ...pkg.peerDependencies, ...pkg.dependencies };
		for (const [name, range] of Object.entries(declared)) {
			if (typeof range === 'string' && range.startsWith(WORKSPACE_PROTOCOL)) {
				const workspaceDir = findInstalledPackageDir(name, dir);
				if (workspaceDir) {
					queue.push(fs.realpathSync(workspaceDir));
				}
				continue;
			}
			names.add(name);
		}
	}

	return names;
}

function normalizeRepositoryUrl(repository: PackageJsonRepository | undefined, homepage: string | undefined): string | undefined {
	let url = typeof repository === 'string' ? repository : repository?.url;
	if (!url) {
		return typeof homepage === 'string' ? homepage.trim() : undefined;
	}
	url = url.trim();
	url = url.replace(/^git\+/, '');
	url = url.replace(/^git:\/\//, 'https://');
	url = url.replace(/^ssh:\/\/git@/, 'https://');
	url = url.replace(/^git@([^:]+):/, 'https://$1/');
	url = url.replace(/\.git(#.*)?$/, '');
	if (url.startsWith('github:')) {
		url = `https://github.com/${url.slice('github:'.length)}`;
	} else if (/^[\w.-]+\/[\w.-]+$/.test(url)) {
		// npm shorthand "owner/repo"
		url = `https://github.com/${url}`;
	}
	return url.startsWith('http') ? url : undefined;
}

function findLicenseFileName(packageDir: string): string | undefined {
	try {
		return fs.readdirSync(packageDir).find((entry) => LICENSE_FILE_PATTERN.test(entry));
	} catch {
		return undefined;
	}
}

/** Trailing-slash strip without a regex: `/\/+$/` backtracks quadratically on slash-only input. */
function stripTrailingSlashes(value: string): string {
	let end = value.length;
	while (end > 0 && value[end - 1] === '/') end--;
	return value.slice(0, end);
}

function buildLicenseUrl(repositoryUrl: string | undefined, repositoryDirectory: string | undefined, licenseFileName: string | undefined): string | undefined {
	if (!repositoryUrl || !licenseFileName || !repositoryUrl.startsWith('https://github.com/')) {
		return repositoryUrl;
	}
	const directoryPrefix = repositoryDirectory ? `${stripTrailingSlashes(repositoryDirectory)}/` : '';
	return `${repositoryUrl}/blob/HEAD/${directoryPrefix}${licenseFileName}`;
}

function normalizeLicense(license: PackageJson['license'], licenses: PackageJson['licenses']): string {
	if (typeof license === 'string') {
		return license;
	}
	if (license && typeof license.type === 'string') {
		return license.type;
	}
	if (Array.isArray(licenses)) {
		const types = licenses.map((entry) => (typeof entry === 'string' ? entry : entry?.type)).filter(Boolean);
		if (types.length > 0) {
			return types.join(' OR ');
		}
	}
	return 'Unknown';
}

/**
 * Build the license entry list for the app at `appDir`.
 * Returns entries sorted by package name.
 */
export function collectLicenses(appDir: string): LicenseEntry[] {
	const entries: LicenseEntry[] = [];
	for (const name of collectDirectDependencyNames(appDir)) {
		const packageDir = findInstalledPackageDir(name, appDir);
		if (!packageDir) {
			console.warn(`[collectLicenses] Package "${name}" is not installed - skipping.`);
			continue;
		}
		let pkg: PackageJson;
		try {
			pkg = readJson(path.join(packageDir, 'package.json'));
		} catch (error) {
			console.warn(`[collectLicenses] Could not read package.json of "${name}" - skipping.`, error);
			continue;
		}
		const repositoryUrl = normalizeRepositoryUrl(pkg.repository, pkg.homepage);
		const repositoryDirectory = typeof pkg.repository === 'object' ? pkg.repository?.directory : undefined;
		entries.push({
			name,
			version: pkg.version ?? 'unknown',
			license: normalizeLicense(pkg.license, pkg.licenses),
			repository: repositoryUrl,
			licenseUrl: buildLicenseUrl(repositoryUrl, repositoryDirectory, findLicenseFileName(packageDir)),
		});
	}
	entries.sort((a, b) => a.name.localeCompare(b.name));
	return entries;
}

