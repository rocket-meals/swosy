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
	PrivacyCollectedData,
	getExpoBuildPropertiesPlugin,
	getExpoSplashScreenPlugin,
	getExpoUpdatesPlugin,
	getMealPhotoImagePickerPlugin,
	getPrivacyManifests,
	getRuntimeVersion,
	getUpdatesConfig,
	getWebConfig,
} = require('repo-depkit-common/appconfig/expoAppConfig.ts');

const EAS_PROJECT_ID = '8fbc9283-a03b-4ca0-92cd-fcb87d2e64f4';

// Apple privacy manifest of THIS app (required for App Review). Geonexia records
// activities against its backend, so location, messages, photos, other user
// content and the account email leave the device.
const GEONEXIA_PRIVACY = {
	collectedDataTypes: [
		PrivacyCollectedData.PreciseLocation,
		PrivacyCollectedData.EmailsOrTextMessages,
		PrivacyCollectedData.PhotosOrVideos,
		PrivacyCollectedData.OtherUserContent,
		PrivacyCollectedData.EmailAddress,
	],
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
		name: 'Geonexia',
		slug: 'geonexia',
		version: getVersion(),
		orientation: 'default',
		icon: './assets/generated/icon.png',
		scheme: 'geonexia',
		userInterfaceStyle: 'automatic',
		ios: {
			supportsTablet: true,
			bundleIdentifier: 'de.baumgartner-software.geonexia',
			buildNumber: buildNumber.toString(),
			infoPlist: {
				UIBackgroundModes: ['audio', 'location'],
				NSPhotoLibraryUsageDescription: 'We need access to your photo library to select files',
				NSDocumentDirectoryUsageDescription: 'We need access to your document directory to select files',
			},
			config: {
				usesNonExemptEncryption: false,
			},
			privacyManifests: getPrivacyManifests(GEONEXIA_PRIVACY),
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/generated/adaptive-icon.png',
				backgroundColor: '#ffffff',
			},
			package: 'com.geonexia.app',
			blockedPermissions: ['android.permission.READ_MEDIA_IMAGES', 'android.permission.READ_MEDIA_VIDEO'],
			versionCode: buildNumber,
		},
		web: getWebConfig('./assets/generated/favicon.png'),
		plugins: [
			'expo-router',
			'expo-secure-store',
			'expo-notifications',
			'expo-web-browser',
			['expo-document-picker', { iCloudContainerEnvironment: 'Production' }],
			'expo-task-manager',
			[
				'expo-audio',
				{
					enableBackgroundPlayback: true,
				},
			],
			[
				'expo-location',
				{
					locationWhenInUsePermission: 'Allow Geonexia to use your location to center the map and track your activity.',
					locationAlwaysAndWhenInUsePermission: 'Allow Geonexia to use your location in the background to continue recording your activity.',
					isIosBackgroundLocationEnabled: true,
					isAndroidBackgroundLocationEnabled: true,
				},
			],
			getExpoSplashScreenPlugin({ image: './assets/generated/splash.png', backgroundColor: '#ffffff' }),
			getExpoUpdatesPlugin(),
			getMealPhotoImagePickerPlugin(),
			getExpoBuildPropertiesPlugin(),
			'expo-localization',
			'expo-asset',
			'expo-font',
		],
		updates: getUpdatesConfig(EAS_PROJECT_ID),
		runtimeVersion: getRuntimeVersion(),
		experiments: {
			typedRoutes: true,
		},
		extra: {
			eas: {
				projectId: EAS_PROJECT_ID,
			},
			// Open-source dependency versions of this app and of its workspace
			// packages (repo-depkit-common, repo-depkit-common-ui), collected from
			// node_modules at config-evaluation time (expo start / export / build /
			// update) and read at runtime via Constants.expoConfig.extra.licenses.
			licenses: collectLicenses(__dirname),
		},
	};
};
