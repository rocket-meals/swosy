#!/usr/bin/env node
// Bootstraps the iOS build credentials of an Expo app WITHOUT any interactive
// prompt, so a brand-new app can be built in CI right away.
//
// Background: `eas build --non-interactive` never creates missing credentials -
// for a new app it aborts with "Credentials are not set up. Run this command
// again in interactive mode." The interactive flow, on the other hand, is
// already prompt-free when an App Store Connect API key is provided via the
// EXPO_ASC_* environment variables (see .github/actions/prepare-asc-api-key),
// EXCEPT for a single confirm ("Reuse this distribution certificate?") and the
// generic prompt helpers around it.
//
// This script therefore runs eas-cli's own `credentials:configure-build`
// command in-process and patches its prompt helpers to auto-answer:
// - confirms are answered with "yes" (reuse the team's distribution
//   certificate, generate missing provisioning profiles),
// - selects pick the first (recommended) choice.
// Everything else (Apple authentication, certificate validation, provisioning
// profile creation for every target incl. app extensions) is what eas-cli does
// in interactive mode anyway. The run is idempotent: with valid credentials in
// place it validates them and changes nothing.
//
// It also fixes eas-cli's Apple capability auto-sync (which must ALWAYS stay
// enabled - never set EXPO_NO_CAPABILITY_SYNC=1 in this repository): current
// eas-cli/@expo/apple-utils sends one big PATCH /v1/bundleIds/{id} with inline
// capability attributes, which today's App Store Connect API rejects with
// "Unexpected or invalid value at 'data.relationships.bundleIdCapabilities.
// data.[0].attributes'". This script replaces that single call with the
// documented per-capability requests (POST /v1/bundleIdCapabilities to enable,
// DELETE /v1/bundleIdCapabilities/{id} to disable) - same sync semantics, same
// desired state, working request format. Once the capabilities match, later
// syncs (e.g. inside `eas build`) produce an empty patch request and never hit
// the broken code path.
//
// One thing CANNOT be automated: creating an App Group and assigning it to
// bundle ids. Apple's public App Store Connect API has no /v1/appGroups
// endpoint - only the cookie-authenticated (Apple-ID login) developer portal
// can do this, which is why eas-cli logs "Skipping capability identifier
// syncing" in CI. That one-time manual step is documented in
// apps/tag-und-jahr/README.md. To surface a missing assignment immediately
// (instead of ~25 minutes later as a cryptic Xcode signing error), this script
// verifies after the credentials setup that the freshly issued provisioning
// profiles actually contain the expected App Group (VERIFY_* env vars below).
//
// Usage:
//   EAS_CLI_ROOT=/path/to/node_modules/eas-cli \
//   node scripts/eas-setup-ios-build-credentials.js <project-dir> [profile]
//
// Required env:
//   EAS_CLI_ROOT           root directory of an installed eas-cli package
//   EXPO_TOKEN             Expo access token (EAS authentication)
//   EXPO_ASC_API_KEY_PATH  path to the App Store Connect API .p8 key
//   EXPO_ASC_KEY_ID, EXPO_ASC_ISSUER_ID, EXPO_APPLE_TEAM_ID, EXPO_APPLE_TEAM_TYPE
//
// Optional env (post-setup verification):
//   VERIFY_APP_GROUP       App Group id the profiles must contain
//   VERIFY_BUNDLE_IDS      comma-separated bundle ids whose newest App Store
//                          profile is checked for VERIFY_APP_GROUP
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const { createRequire } = require('node:module');

function fail(message) {
	console.error(`❌ ${message}`);
	process.exit(1);
}

const projectDir = process.argv[2];
const profile = process.argv[3] || 'production';
if (!projectDir) {
	fail('Usage: node scripts/eas-setup-ios-build-credentials.js <project-dir> [profile]');
}

const easCliRoot = process.env.EAS_CLI_ROOT;
if (!easCliRoot || !fs.existsSync(path.join(easCliRoot, 'build', 'prompts.js'))) {
	fail(`EAS_CLI_ROOT does not point to an eas-cli installation: ${easCliRoot}`);
}

for (const name of ['EXPO_TOKEN', 'EXPO_ASC_API_KEY_PATH', 'EXPO_ASC_KEY_ID', 'EXPO_ASC_ISSUER_ID', 'EXPO_APPLE_TEAM_ID', 'EXPO_APPLE_TEAM_TYPE']) {
	if (!process.env[name]) {
		fail(`Missing required environment variable ${name}`);
	}
}

// Patch the prompt helpers BEFORE any command module is loaded. All eas-cli
// modules share this CommonJS exports object and look the functions up at call
// time, so replacing the properties here affects the whole run.
const prompts = require(path.join(easCliRoot, 'build', 'prompts.js'));

prompts.confirmAsync = async ({ message }) => {
	console.log(`[auto-confirm] ${message} -> yes`);
	return true;
};

prompts.selectAsync = async (message, choices) => {
	const first = choices[0];
	console.log(`[auto-select] ${message} -> ${first?.title}`);
	if (!first) {
		throw new Error(`Cannot auto-answer select without choices: ${message}`);
	}
	return first.value;
};

prompts.promptAsync = async (questions) => {
	const list = Array.isArray(questions) ? questions : [questions];
	const answers = {};
	for (const question of list) {
		if (question.type === 'select' && question.choices?.length) {
			answers[question.name] = question.choices[0].value;
		} else if (question.type === 'confirm' || question.type === 'toggle') {
			answers[question.name] = true;
		} else if (question.initial !== undefined) {
			answers[question.name] = typeof question.initial === 'function' ? await question.initial() : question.initial;
		} else {
			throw new Error(`Cannot auto-answer interactive prompt: ${question.message}`);
		}
		console.log(`[auto-answer] ${question.message} -> ${answers[question.name]}`);
	}
	return answers;
};

prompts.pressAnyKeyToContinueAsync = async () => {};

// ─── Fix Apple capability auto-sync ──────────────────────────────────────────
// Replace apple-utils' broken bulk PATCH (rejected by today's ASC API) with the
// documented per-capability requests, talking directly to the App Store Connect
// API using the same .p8 key. Auto-sync itself stays fully enabled.

function base64url(input) {
	return Buffer.from(input).toString('base64url');
}

function createAscApiToken() {
	const now = Math.floor(Date.now() / 1000);
	const header = { alg: 'ES256', kid: process.env.EXPO_ASC_KEY_ID, typ: 'JWT' };
	const payload = { iss: process.env.EXPO_ASC_ISSUER_ID, iat: now - 10, exp: now + 10 * 60, aud: 'appstoreconnect-v1' };
	const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
	const key = fs.readFileSync(process.env.EXPO_ASC_API_KEY_PATH, 'utf8');
	// JWT ES256 requires the raw (IEEE P1363) signature encoding.
	const signature = crypto.sign('sha256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });
	return `${signingInput}.${signature.toString('base64url')}`;
}

async function ascRequestAsync(method, pathname, body) {
	const response = await fetch(`https://api.appstoreconnect.apple.com${pathname}`, {
		method,
		headers: {
			Authorization: `Bearer ${createAscApiToken()}`,
			'Content-Type': 'application/json',
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	if (response.status === 204) {
		return null;
	}
	const text = await response.text();
	const json = text ? JSON.parse(text) : null;
	if (!response.ok) {
		const error = new Error(`ASC API ${method} ${pathname} failed with ${response.status}: ${text}`);
		error.status = response.status;
		error.details = json;
		throw error;
	}
	return json;
}

async function enableCapabilityAsync(bundleIdId, operation) {
	try {
		await ascRequestAsync('POST', '/v1/bundleIdCapabilities', {
			data: {
				type: 'bundleIdCapabilities',
				attributes: {
					capabilityType: operation.capabilityType,
					settings: operation.settings ?? [],
				},
				relationships: {
					bundleId: { data: { type: 'bundleIds', id: bundleIdId } },
				},
			},
		});
		console.log(`[capability-sync] enabled ${operation.capabilityType}`);
	} catch (error) {
		// 409 = capability already enabled - the desired state is reached.
		if (error.status === 409) {
			console.log(`[capability-sync] ${operation.capabilityType} already enabled`);
			return;
		}
		throw error;
	}
}

async function disableCapabilityAsync(bundleIdId, operation) {
	const listing = await ascRequestAsync('GET', `/v1/bundleIds/${bundleIdId}/bundleIdCapabilities?limit=200`);
	const existing = listing?.data?.find((capability) => capability.attributes?.capabilityType === operation.capabilityType);
	if (!existing) {
		console.log(`[capability-sync] ${operation.capabilityType} already disabled`);
		return;
	}
	await ascRequestAsync('DELETE', `/v1/bundleIdCapabilities/${existing.id}`);
	console.log(`[capability-sync] disabled ${operation.capabilityType}`);
}

// Resolve exactly the @expo/apple-utils copy that eas-cli itself uses.
const easCliRequire = createRequire(path.join(easCliRoot, 'build', 'prompts.js'));
const appleUtils = easCliRequire('@expo/apple-utils');
if (typeof appleUtils.BundleId?.prototype?.updateBundleIdCapabilityAsync !== 'function') {
	fail('Could not patch @expo/apple-utils: BundleId.updateBundleIdCapabilityAsync not found (eas-cli internals changed?)');
}
appleUtils.BundleId.prototype.updateBundleIdCapabilityAsync = async function (operations) {
	const list = Array.isArray(operations) ? operations : [operations];
	console.log(`[capability-sync] syncing ${list.length} capability change(s) for ${this.attributes?.identifier ?? this.id} via per-capability ASC API requests`);
	for (const operation of list) {
		if (operation.option === 'OFF') {
			await disableCapabilityAsync(this.id, operation);
		} else {
			await enableCapabilityAsync(this.id, operation);
		}
	}
};

// ─── Post-setup verification: App Group inside the provisioning profiles ────
// Apple's public API cannot create or assign App Groups (no /v1/appGroups), so
// that part is a one-time manual portal step. eas-cli's own profile validation
// checks certificate, bundle id, expiry and portal status - NOT the profile's
// entitlements. A profile created BEFORE the App Group was assigned can
// therefore stay "valid" forever while Xcode signing keeps failing. This
// verification detects that, self-heals by deleting the stale portal profile
// (documented DELETE /v1/profiles/{id}) and re-running the credentials setup so
// eas issues a fresh profile - which then includes the assigned App Group. Only
// if the group STILL is missing afterwards (portal step not done) it fails with
// step-by-step instructions.

async function collectAppGroupProblemsAsync(bundleIdentifiers, appGroup) {
	const problems = [];
	for (const bundleIdentifier of bundleIdentifiers) {
		const bundleIdListing = await ascRequestAsync('GET', `/v1/bundleIds?filter[identifier]=${encodeURIComponent(bundleIdentifier)}&limit=200`);
		const bundleIdResource = bundleIdListing?.data?.find((entry) => entry.attributes?.identifier === bundleIdentifier);
		if (!bundleIdResource) {
			problems.push({ bundleIdentifier, message: `Bundle id ${bundleIdentifier} not found in the Apple developer portal.` });
			continue;
		}
		const profileListing = await ascRequestAsync(
			'GET',
			`/v1/bundleIds/${bundleIdResource.id}/profiles?fields[profiles]=name,profileState,profileType,createdDate,profileContent&limit=200`
		);
		const appStoreProfiles = (profileListing?.data ?? [])
			.filter((entry) => entry.attributes?.profileType === 'IOS_APP_STORE' && entry.attributes?.profileState === 'ACTIVE')
			.sort((a, b) => new Date(b.attributes.createdDate) - new Date(a.attributes.createdDate));
		const newestProfile = appStoreProfiles[0];
		if (!newestProfile) {
			problems.push({ bundleIdentifier, message: `No active App Store provisioning profile found for ${bundleIdentifier}.` });
			continue;
		}
		const profileContent = Buffer.from(newestProfile.attributes.profileContent, 'base64').toString('latin1');
		if (!profileContent.includes(appGroup)) {
			problems.push({
				bundleIdentifier,
				staleProfile: { id: newestProfile.id, name: newestProfile.attributes.name },
				message: `Provisioning profile "${newestProfile.attributes.name}" for ${bundleIdentifier} does not contain the App Group ${appGroup}.`,
			});
		} else {
			console.log(`[verify] profile for ${bundleIdentifier} contains App Group ${appGroup}`);
		}
	}
	return problems;
}

function reportAppGroupProblemsAndFail(problems, bundleIdentifiers, appGroup) {
	console.error('');
	for (const problem of problems) {
		console.error(`❌ ${problem.message}`);
	}
	console.error('');
	console.error('The App Group must be created and assigned ONCE manually - the public App Store');
	console.error('Connect API cannot manage App Groups (no /v1/appGroups endpoint), so no CI job can');
	console.error('do this for you:');
	console.error('');
	console.error(`  1. https://developer.apple.com/account/resources/identifiers/list/applicationGroup`);
	console.error(`     -> "+" -> register the App Group "${appGroup}".`);
	for (const bundleIdentifier of bundleIdentifiers) {
		console.error(`  2. Identifiers -> App IDs -> ${bundleIdentifier} -> capability "App Groups"`);
		console.error(`     -> Configure -> select "${appGroup}" -> Save.`);
	}
	console.error('  3. Re-run this workflow afterwards: stale provisioning profiles are replaced');
	console.error('     automatically and will then include the App Group.');
	fail('Provisioning profiles are missing the required App Group.');
}

async function verifyProfilesContainAppGroupAsync(bundleIdentifiers, appGroup, runCredentialsSetupAsync) {
	let problems = await collectAppGroupProblemsAsync(bundleIdentifiers, appGroup);
	const staleProfiles = problems.filter((problem) => problem.staleProfile);
	if (staleProfiles.length) {
		// Self-heal: the profiles predate the App Group assignment (or the
		// assignment is missing). Deleting them on the portal makes eas-cli's
		// validation fail ("does not exist in Apple Developer Portal"), so the
		// re-run below issues fresh profiles that pick up the current bundle id
		// configuration - including an assigned App Group.
		for (const problem of staleProfiles) {
			console.log(`[verify] deleting stale provisioning profile "${problem.staleProfile.name}" (${problem.staleProfile.id}) to force regeneration...`);
			await ascRequestAsync('DELETE', `/v1/profiles/${problem.staleProfile.id}`);
		}
		console.log('[verify] re-running credentials setup to regenerate the deleted profiles...');
		await runCredentialsSetupAsync();
		problems = await collectAppGroupProblemsAsync(bundleIdentifiers, appGroup);
	}
	if (problems.length) {
		reportAppGroupProblemsAndFail(problems, bundleIdentifiers, appGroup);
	}
}

process.chdir(projectDir);

const ConfigureBuild = require(path.join(easCliRoot, 'build', 'commands', 'credentials', 'configure-build.js')).default;
const runCredentialsSetupAsync = () => ConfigureBuild.run(['--platform', 'ios', '--profile', profile], easCliRoot);

runCredentialsSetupAsync()
	.then(async () => {
		const appGroup = process.env.VERIFY_APP_GROUP;
		const bundleIdentifiers = (process.env.VERIFY_BUNDLE_IDS || '').split(',').map((entry) => entry.trim()).filter(Boolean);
		if (appGroup && bundleIdentifiers.length) {
			await verifyProfilesContainAppGroupAsync(bundleIdentifiers, appGroup, runCredentialsSetupAsync);
		}
		console.log('✅ iOS build credentials are set up');
	})
	.catch((error) => {
		console.error(error);
		fail('Setting up iOS build credentials failed');
	});
