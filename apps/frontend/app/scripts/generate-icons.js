#!/usr/bin/env node
/**
 * Generates app icons by copying customer source images to assets/generated/.
 *
 * Runs as a postinstall hook so that EAS Build (and local development) always
 * have the required icon files, even when the full ImageMagick-based
 * generateIcons.sh has not been executed.
 *
 * If icons_hash.json already exists in the output directory (written by
 * generateIcons.sh), this script is a no-op so the higher-quality
 * ImageMagick-generated icons are kept.
 */

const fs = require('fs');
const path = require('path');

// Resolve paths relative to the app directory (parent of scripts/).
const APP_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(APP_DIR, 'assets', 'generated');

// If the full ImageMagick icon generation already ran, skip.
if (fs.existsSync(path.join(OUTPUT_DIR, 'icons_hash.json'))) {
	console.log('[generate-icons] Icons already generated (icons_hash.json found). Skipping.');
	process.exit(0);
}

// Customer → source-image subfolder mapping.
const CUSTOMER_MAP = {
	test: 'rocket-meals',
	swosy: 'swosy',
	'studi-futter': 'studi-futter',
};

const customer = process.env.EXPO_PUBLIC_CUSTOMER || process.env.CUSTOMER || 'test';
const customerDir = CUSTOMER_MAP[customer] || 'rocket-meals';

const CUSTOMERS_DIR = path.join(APP_DIR, 'assets', 'images', 'customers');
const iconSource = path.join(CUSTOMERS_DIR, customerDir, 'icon.png');
const companySource = path.join(CUSTOMERS_DIR, customerDir, 'company.png');

if (!fs.existsSync(iconSource)) {
	console.warn('[generate-icons] Icon source not found: ' + iconSource + '. Skipping.');
	process.exit(0);
}

if (!fs.existsSync(companySource)) {
	console.warn('[generate-icons] Company logo not found: ' + companySource + '. Skipping.');
	process.exit(0);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Icon-based assets
var iconTargets = ['icon.png', 'notification-icon.png', 'adaptive-icon.png', 'favicon.png'];
for (var i = 0; i < iconTargets.length; i++) {
	fs.copyFileSync(iconSource, path.join(OUTPUT_DIR, iconTargets[i]));
}

// Company-logo-based assets
var companyTargets = ['splash.png', 'splash-icon.png', 'company.png'];
for (var j = 0; j < companyTargets.length; j++) {
	fs.copyFileSync(companySource, path.join(OUTPUT_DIR, companyTargets[j]));
}

console.log('[generate-icons] Generated icons for customer "' + customer + '" (' + customerDir + ') in ' + OUTPUT_DIR);
