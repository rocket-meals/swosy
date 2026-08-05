'use strict';

/**
 * Collects open-source license information for an app and all of its
 * workspace dependencies (e.g. repo-depkit-common, repo-depkit-common-ui).
 *
 * Intended to be called from an app's metro.config.js so the generated
 * license list is refreshed on every bundler start (expo start / expo export /
 * EAS build) and always reflects the currently *installed* versions from
 * node_modules — no manual maintenance and no extra CI job required.
 *
 * Plain CommonJS with zero dependencies so it can run inside metro.config.js.
 */

const fs = require('node:fs');
const path = require('node:path');

const WORKSPACE_PROTOCOL = 'workspace:';
const LICENSE_FILE_PATTERN = /^(licen[cs]e|copying)(\.(md|txt|markdown))?$/i;

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Resolve the directory of an installed package by walking up the
 * node_modules chain starting at `startDir` (handles hoisting in the
 * yarn workspace monorepo).
 */
function findInstalledPackageDir(name, startDir) {
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
function collectDirectDependencyNames(appDir) {
	const names = new Set();
	const visitedPackageJsons = new Set();
	const queue = [appDir];

	while (queue.length > 0) {
		const dir = queue.pop();
		const packageJsonPath = path.join(dir, 'package.json');
		if (visitedPackageJsons.has(packageJsonPath)) {
			continue;
		}
		visitedPackageJsons.add(packageJsonPath);

		let pkg;
		try {
			pkg = readJson(packageJsonPath);
		} catch {
			continue;
		}

		const declared = { ...(pkg.peerDependencies ?? {}), ...(pkg.dependencies ?? {}) };
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

function normalizeRepositoryUrl(repository, homepage) {
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

function findLicenseFileName(packageDir) {
	try {
		return fs.readdirSync(packageDir).find((entry) => LICENSE_FILE_PATTERN.test(entry));
	} catch {
		return undefined;
	}
}

function buildLicenseUrl(repositoryUrl, repositoryDirectory, licenseFileName) {
	if (!repositoryUrl || !licenseFileName || !repositoryUrl.startsWith('https://github.com/')) {
		return repositoryUrl;
	}
	const directoryPrefix = repositoryDirectory ? `${repositoryDirectory.replace(/\/+$/, '')}/` : '';
	return `${repositoryUrl}/blob/HEAD/${directoryPrefix}${licenseFileName}`;
}

function normalizeLicense(license, licenses) {
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
function collectLicenses(appDir) {
	const entries = [];
	for (const name of collectDirectDependencyNames(appDir)) {
		const packageDir = findInstalledPackageDir(name, appDir);
		if (!packageDir) {
			console.warn(`[collectLicenses] Package "${name}" is not installed - skipping.`);
			continue;
		}
		let pkg;
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

function renderGeneratedFile(entries) {
	const lines = [
		'// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY.',
		'//',
		'// Generated by packages/common/licenses/collectLicenses.cjs, which is',
		'// invoked from this app\'s metro.config.js on every bundler start',
		'// (expo start / expo export / EAS build). It lists the currently',
		'// installed direct dependencies of this app and of its workspace',
		'// packages (repo-depkit-common, repo-depkit-common-ui, ...).',
		'//',
		'// The file is committed so type checks and tests work without running',
		'// Metro; it rewrites itself whenever the installed dependencies change.',
		'',
		"import type { LicensePackageInfo } from 'repo-depkit-common-ui';",
		'',
		'const licenses: LicensePackageInfo[] = [',
		...entries.map((entry) => {
			const fields = [
				`name: ${JSON.stringify(entry.name)}`,
				`version: ${JSON.stringify(entry.version)}`,
				`license: ${JSON.stringify(entry.license)}`,
			];
			if (entry.repository) {
				fields.push(`repository: ${JSON.stringify(entry.repository)}`);
			}
			if (entry.licenseUrl) {
				fields.push(`licenseUrl: ${JSON.stringify(entry.licenseUrl)}`);
			}
			return `\t{ ${fields.join(', ')} },`;
		}),
		'];',
		'',
		'export default licenses;',
		'',
	];
	return lines.join('\n');
}

/**
 * Generate the license file for the app at `appDir` and write it to
 * `outputPath`. The file is only rewritten when its content changed, so
 * repeated bundler starts keep git and file watchers quiet.
 *
 * Never throws: bundling must not fail because of license collection.
 */
function writeLicenseFile({ appDir, outputPath }) {
	try {
		const entries = collectLicenses(appDir);
		if (entries.length === 0) {
			// node_modules not installed (e.g. bare checkout) - keep the committed file.
			console.warn('[collectLicenses] No installed dependencies found - keeping existing license file.');
			return;
		}
		const content = renderGeneratedFile(entries);
		let previous;
		try {
			previous = fs.readFileSync(outputPath, 'utf8');
		} catch {
			previous = undefined;
		}
		if (previous !== content) {
			fs.mkdirSync(path.dirname(outputPath), { recursive: true });
			fs.writeFileSync(outputPath, content);
			console.log(`[collectLicenses] Updated ${path.relative(appDir, outputPath)} (${entries.length} packages).`);
		}
	} catch (error) {
		console.warn('[collectLicenses] Failed to generate license file:', error);
	}
}

module.exports = { collectLicenses, writeLicenseFile };
