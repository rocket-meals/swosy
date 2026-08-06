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

const { getBuildNumber, getVersion } = require('./config.ts');
const { collectLicenses } = require('repo-depkit-common/licenses/collectLicenses.ts');

module.exports = function getExpoConfig({ config }: ConfigContext): ExpoConfig {
	const buildNumber = getBuildNumber();
	return {
		...config,
		owner: 'baumgartner-software',
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
			// Apple privacy manifest (required for App Review): the app collects
			// no data off-device - everything is stored locally. The accessed-API
			// reasons cover the React Native/Expo SDK internals (UserDefaults,
			// boot time, disk space, file timestamps), same as apps/geonexia.
			privacyManifests: {
				NSPrivacyCollectedDataTypes: [],
				NSPrivacyAccessedAPITypes: [
					{
						NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
						NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
					},
					{
						NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
						NSPrivacyAccessedAPITypeReasons: ['8FFB.1'],
					},
					{
						NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
						NSPrivacyAccessedAPITypeReasons: ['85F4.1'],
					},
					{
						NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
						NSPrivacyAccessedAPITypeReasons: ['DDA9.1'],
					},
				],
			},
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
		web: {
			bundler: 'metro',
			output: 'static',
			favicon: './assets/icons/app_icon_source.png',
		},
		updates: {
			enabled: true,
			url: 'https://u.expo.dev/7ea1e999-21dd-41ec-96b3-fc8aa7ad9993',
			fallbackToCacheTimeout: 10 * 1000,
		},
		runtimeVersion: {
			policy: 'appVersion',
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
			['expo-updates', { username: 'jack5496' }],
			'expo-localization',
			'expo-font',
			[
				'expo-image-picker',
				{
					photosPermission: 'Erlaube den Zugriff auf deine Fotos, um einem Spiel ein eigenes Bild zu geben.',
					cameraPermission: 'Erlaube den Zugriff auf die Kamera, um ein Bild für ein Spiel aufzunehmen.',
				},
			],
		],
		experiments: {
			typedRoutes: true,
		},
		extra: {
			eas: {
				projectId: '7ea1e999-21dd-41ec-96b3-fc8aa7ad9993',
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
