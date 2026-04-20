#!/usr/bin/env node

/**
 * EAS Build post-install hook: generates the required icon/splash assets
 * from customer source images inside the ./assets/generated/ directory.
 *
 * Background:
 *   The frontend app is multi-tenant. Source icons live under
 *   assets/images/customers/<customer>/  and the final build assets are
 *   generated into assets/generated/  which is .gitignore'd.
 *
 *   On CI (GitHub Actions) the full generateIcons.sh (ImageMagick) runs
 *   before `eas build`, but EAS Build respects .gitignore when uploading
 *   the project archive, so the generated files are missing on EAS servers.
 *
 *   This lightweight script copies the customer source images directly.
 *   Expo handles any necessary resizing during the native prebuild step,
 *   so full ImageMagick processing is not required here.
 */

const fs = require('fs');
const path = require('path');

const APP_ROOT = path.resolve(__dirname, '..');

// Register ts-node so we can require the TypeScript config
require('ts-node').register({
	transpileOnly: true,
	compilerOptions: { module: 'Node16', moduleResolution: 'node16' },
});

const { getCustomerConfig } = require(path.resolve(APP_ROOT, 'config.ts'));

const config = getCustomerConfig();
const GENERATED_DIR = path.resolve(APP_ROOT, 'assets', 'generated');

// Ensure the generated directory exists
fs.mkdirSync(GENERATED_DIR, { recursive: true });

const iconSource = path.resolve(APP_ROOT, config.images.icon_logo_source_path);
const companySource = path.resolve(APP_ROOT, config.images.company_logo_source_path);

console.log(`Customer: ${config.projectName}`);
console.log(`Icon source: ${iconSource}`);
console.log(`Company source: ${companySource}`);

if (!fs.existsSync(iconSource)) {
	console.error(`ERROR: Icon source not found: ${iconSource}`);
	process.exit(1);
}
if (!fs.existsSync(companySource)) {
	console.error(`ERROR: Company logo source not found: ${companySource}`);
	process.exit(1);
}

// Icon-derived assets
const iconTargets = ['icon.png', 'favicon.png', 'notification-icon.png', 'adaptive-icon.png'];
for (const target of iconTargets) {
	const dest = path.join(GENERATED_DIR, target);
	fs.copyFileSync(iconSource, dest);
	console.log(`  Copied icon -> ${target}`);
}

// Company-logo-derived assets (splash screens)
const companyTargets = ['company.png', 'splash.png', 'splash-icon.png'];
for (const target of companyTargets) {
	const dest = path.join(GENERATED_DIR, target);
	fs.copyFileSync(companySource, dest);
	console.log(`  Copied company logo -> ${target}`);
}

console.log(`Generated ${iconTargets.length + companyTargets.length} assets in ${GENERATED_DIR}`);
