import type { ConfigContext, ExpoConfig } from '@expo/config';

// Register ts-node so Expo can load TypeScript config helpers without a
// precompiled JavaScript file.
require('repo-depkit-common/appconfig/registerTsNode.js').registerTsNode();

const { getBuildNumber, getVersion } = require('./config.ts');
const { collectLicenses } = require('repo-depkit-common/licenses/collectLicenses.ts');
// Settings that are deliberately identical in every app of this monorepo (iOS
// deployment target, Android SDK levels, OTA setup) live in
// repo-depkit-common/appconfig, together with the named building blocks each
// app composes its own privacy manifest from.
const {
	EXPO_OWNER,
	PrivacyAccessedApi,
	getExpoBuildPropertiesPlugin,
	getExpoSplashScreenPlugin,
	getExpoUpdatesPlugin,
	getPrivacyManifests,
	getRuntimeVersion,
	getUpdatesConfig,
	getWebConfig,
} = require('repo-depkit-common/appconfig/expoAppConfig.ts');

const EAS_PROJECT_ID = '7ea1e999-21dd-41ec-96b3-fc8aa7ad9993';

// Apple privacy manifest of THIS app (required for App Review). Punktlandung
// stores everything locally - no collected data types at all.
const SCORE_TRACKER_PRIVACY = {
	// Required-reason APIs of the React Native/Expo runtime itself.
	accessedApiTypes: [
		PrivacyAccessedApi.UserDefaults,
		PrivacyAccessedApi.SystemBootTime,
		PrivacyAccessedApi.DiskSpace,
		PrivacyAccessedApi.FileTimestamp,
	],
};

module.exports = function getExpoConfig({ config }: ConfigContext): ExpoConfig {
	const buildNumber = getBuildNumber();
	return {
		...config,
		owner: EXPO_OWNER,
		name: 'Punktlandung',
		slug: 'score-tracker',
		version: getVersion(),
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
			privacyManifests: getPrivacyManifests(SCORE_TRACKER_PRIVACY),
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/icons/app_icon_source.png',
				backgroundColor: '#ffffff',
			},
			package: 'com.scoretracker.app',
			// Android 13+ uses the system photo picker (expo-image-picker), so the
			// broad media permissions are not needed and would only raise Play
			// Console questions - block them like apps/geonexia does.
			blockedPermissions: ['android.permission.READ_MEDIA_IMAGES', 'android.permission.READ_MEDIA_VIDEO'],
			versionCode: buildNumber,
		},
		web: getWebConfig('./assets/icons/app_icon_source.png'),
		updates: getUpdatesConfig(EAS_PROJECT_ID),
		runtimeVersion: getRuntimeVersion(),
		plugins: [
			'expo-router',
			getExpoSplashScreenPlugin({ image: './assets/icons/app_icon_source.png', backgroundColor: '#ffffff' }),
			getExpoUpdatesPlugin(),
			'expo-localization',
			'expo-font',
			[
				'expo-image-picker',
				{
					photosPermission: 'Erlaube den Zugriff auf deine Fotos, um einem Spiel ein eigenes Bild zu geben.',
					cameraPermission: 'Erlaube den Zugriff auf die Kamera, um ein Bild für ein Spiel aufzunehmen.',
				},
			],
			getExpoBuildPropertiesPlugin(),
		],
		experiments: {
			typedRoutes: true,
		},
		extra: {
			eas: {
				projectId: EAS_PROJECT_ID,
			},
			// Optional Google Programmable Search credentials for the game image
			// search (helpers/ImageSearch). With both set, a game's picture comes
			// from Google image results; without them the keyless providers
			// (Wikimedia Commons, Openverse) are used instead - the feature works
			// either way, only the result quality differs.
			googleImageSearch: {
				apiKey: process.env.GOOGLE_IMAGE_SEARCH_API_KEY ?? '',
				searchEngineId: process.env.GOOGLE_IMAGE_SEARCH_ENGINE_ID ?? '',
			},
			// Open-source dependency versions of this app and of its workspace
			// packages (repo-depkit-common, repo-depkit-common-ui, ...), collected
			// from node_modules at config-evaluation time (expo start / export /
			// build / update) and read at runtime via
			// Constants.expoConfig.extra.licenses.
			licenses: collectLicenses(__dirname),
		}
	};
};
