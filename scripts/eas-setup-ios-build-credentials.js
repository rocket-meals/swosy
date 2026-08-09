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
// Usage:
//   EAS_CLI_ROOT=/path/to/node_modules/eas-cli \
//   node scripts/eas-setup-ios-build-credentials.js <project-dir> [profile]
//
// Required env:
//   EAS_CLI_ROOT           root directory of an installed eas-cli package
//   EXPO_TOKEN             Expo access token (EAS authentication)
//   EXPO_ASC_API_KEY_PATH  path to the App Store Connect API .p8 key
//   EXPO_ASC_KEY_ID, EXPO_ASC_ISSUER_ID, EXPO_APPLE_TEAM_ID, EXPO_APPLE_TEAM_TYPE
const path = require('node:path');
const fs = require('node:fs');

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

process.chdir(projectDir);

const ConfigureBuild = require(path.join(easCliRoot, 'build', 'commands', 'credentials', 'configure-build.js')).default;

ConfigureBuild.run(['--platform', 'ios', '--profile', profile], easCliRoot)
	.then(() => {
		console.log('✅ iOS build credentials are set up');
	})
	.catch((error) => {
		console.error(error);
		fail('Setting up iOS build credentials failed');
	});
