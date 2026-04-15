import type { ConfigContext, ExpoConfig } from '@expo/config';

// Register ts-node so Expo can load TypeScript config helpers without a
// precompiled JavaScript file.
require('ts-node').register({
	transpileOnly: true,
	compilerOptions: {
		module: 'Node16',
		moduleResolution: 'node16',
	},
});

const { getBuildNumber } = require('./config.ts');

module.exports = function ({ config }: ConfigContext): ExpoConfig {
	const buildNumber = getBuildNumber();
	return {
		...config,
		owner: 'baumgartner-software',
		name: 'Score Tracker',
		slug: 'score-tracker',
		version: `1.0.${buildNumber}`,
		orientation: 'default',
		icon: './assets/icons/app_icon_source.png',
		scheme: 'score-tracker',
		userInterfaceStyle: 'automatic',
		ios: {
			supportsTablet: true,
			bundleIdentifier: 'de.baumgartner-software.score-tracker',
			buildNumber: buildNumber.toString(),
			config: {
				usesNonExemptEncryption: false,
			},
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/icons/app_icon_source.png',
				backgroundColor: '#ffffff',
			},
			package: 'com.scoretracker.app',
			versionCode: buildNumber,
		},
		web: {
			bundler: 'metro',
			output: 'static',
			favicon: './assets/icons/app_icon_source.png',
		},
		plugins: [
			'expo-router',
			[
				'expo-splash-screen',
				{
					image: './assets/icons/app_icon_source.png',
					imageWidth: 200,
					resizeMode: 'contain',
					backgroundColor: '#ffffff',
				},
			],
			'expo-localization',
			'expo-font',
		],
		experiments: {
			typedRoutes: true,
		},
	};
};
