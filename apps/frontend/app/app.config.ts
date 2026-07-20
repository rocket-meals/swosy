import type { ConfigContext } from '@expo/config';

// Register ts-node so Expo can load TypeScript config helpers without a
// precompiled JavaScript file.
require('ts-node').register({
	transpileOnly: true,
	compilerOptions: {
		module: 'Node16',
		moduleResolution: 'node16',
	},
});

const { getFinalConfig, getCustomerConfig } = require('./config.ts');
const fs = require('fs');
const path = require('path');

/**
 * Generates public/manifest.json for the current customer. Expo copies the
 * public/ directory into the web export, so the manifest ends up next to
 * index.html and is linked from app/+html.tsx.
 *
 * The manifest serves two purposes on Android:
 * - It makes the web app installable / lets Chrome treat it as a web app.
 * - related_applications (+ prefer_related_applications) tells Chrome about
 *   the native Play Store app, so install prompts point to the store and
 *   navigator.getInstalledRelatedApps() can detect an installed app for the
 *   AppDownloadBanner. Full detection additionally requires the native app to
 *   publish matching digital asset links for the web origin.
 *
 * This runs on every Expo CLI invocation (start/export) in Node.js, so the
 * generated file always matches the CUSTOMER/EXPO_PUBLIC_CUSTOMER env vars.
 * The file is gitignored - do not edit it manually.
 */
function writeWebManifest() {
	const customerConfig = getCustomerConfig();
	// Same base path calculation as experiments.baseUrl in getFinalConfig().
	const basePath = (customerConfig.baseUrl || '') + (process.env.EXPO_PUBLIC_BASE_URL_SUFFIX || '');

	const relatedApplications = [];
	if (customerConfig.bundleIdAndroid) {
		relatedApplications.push({
			platform: 'play',
			id: customerConfig.bundleIdAndroid,
			url: `https://play.google.com/store/apps/details?id=${customerConfig.bundleIdAndroid}`,
		});
	}
	if (customerConfig.appleAppId) {
		relatedApplications.push({
			platform: 'itunes',
			url: `https://apps.apple.com/app/id${customerConfig.appleAppId}`,
		});
	}

	const manifest = {
		name: customerConfig.projectName,
		short_name: customerConfig.projectName,
		start_url: `${basePath}/`,
		scope: `${basePath}/`,
		display: 'standalone',
		background_color: '#ffffff',
		theme_color: '#ffffff',
		// src is resolved relative to the manifest URL, which sits next to the
		// favicon generated from the web.favicon config.
		icons: [{ src: 'favicon.ico', sizes: '48x48', type: 'image/x-icon' }],
		// Prefer the native store app over a PWA install prompt when we have one.
		prefer_related_applications: relatedApplications.length > 0,
		related_applications: relatedApplications,
	};

	const publicDir = path.join(__dirname, 'public');
	fs.mkdirSync(publicDir, { recursive: true });
	fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, '\t') + '\n');
}

module.exports = function ({ config }: ConfigContext) {
	writeWebManifest();
	return getFinalConfig(config);
};
