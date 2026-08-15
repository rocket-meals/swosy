/**
 * Shared Expo app config building blocks for every app in this monorepo
 * (apps/frontend, apps/geonexia, apps/score-tracker, apps/tag-und-jahr).
 *
 * Everything in here is knowledge that is deliberately identical across all
 * apps - the iOS deployment target, the Android SDK levels, the OTA/update
 * setup, the Apple privacy manifest boilerplate. Keeping one copy means a
 * bump (e.g. the next Expo SDK raising the iOS minimum) is a single edit
 * instead of four, and the apps cannot silently drift apart.
 *
 * Usage from an app's app.config.ts (Node context, ts-node registered):
 *
 *   const { getExpoBuildPropertiesPlugin } = require('repo-depkit-common/appconfig/expoAppConfig.ts');
 *
 * or, from a config.ts that is also bundled into the app:
 *
 *   import { getExpoBuildPropertiesPlugin } from 'repo-depkit-common/appconfig/expoAppConfig';
 *
 * This module therefore contains plain data and pure functions only - no
 * Node built-ins (fs/path), so it is safe in a Metro bundle as well. The
 * Node-only counterpart is repo-depkit-common/licenses/collectLicenses.ts.
 */

// A plugin entry of an Expo config's `plugins` array: either the bare plugin
// name or a [name, options] tuple.
export type ExpoPluginEntry = string | [string, Record<string, unknown>];

// The Expo/EAS organisation all apps are published under.
export const EXPO_OWNER = 'baumgartner-software';

// Expo account whose credentials sign the OTA updates (expo-updates plugin).
export const EXPO_UPDATES_USERNAME = 'jack5496';

/**
 * iOS deployment target - the oldest iOS version every app is built for.
 *
 * All apps share one floor on purpose: a device that can run one of them can
 * run all of them, and App Review/support expectations stay identical. The
 * value is dictated by the Expo SDK in use (SDK 57 does not support anything
 * below 16.4), so raise it here whenever the SDK minimum rises - never per
 * app.
 */
export const IOS_DEPLOYMENT_TARGET = '16.4';

// Android SDK levels every app compiles and targets against.
export const ANDROID_COMPILE_SDK_VERSION = 36;
export const ANDROID_TARGET_SDK_VERSION = 36;
export const ANDROID_BUILD_TOOLS_VERSION = '36.0.0';

// How long a cold start waits for a fresh OTA update before falling back to
// the bundled/cached one.
export const UPDATES_FALLBACK_TO_CACHE_TIMEOUT_MS = 10 * 1000;

/**
 * DO NOT CHANGE THE NAME OF THIS FUNCTION: getIosDeploymentTarget
 * Single source of truth for the iOS deployment target of all apps, see
 * IOS_DEPLOYMENT_TARGET.
 */
export function getIosDeploymentTarget(): string {
	return IOS_DEPLOYMENT_TARGET;
}

/**
 * The expo-build-properties plugin entry: iOS deployment target plus the
 * Android SDK levels. Requires `expo-build-properties` in the app's
 * dependencies.
 */
export function getExpoBuildPropertiesPlugin(): ExpoPluginEntry {
	return [
		'expo-build-properties',
		{
			android: {
				compileSdkVersion: ANDROID_COMPILE_SDK_VERSION,
				targetSdkVersion: ANDROID_TARGET_SDK_VERSION,
				buildToolsVersion: ANDROID_BUILD_TOOLS_VERSION,
			},
			ios: {
				deploymentTarget: getIosDeploymentTarget(),
			},
		},
	];
}

/** The expo-updates plugin entry (OTA update signing account). */
export function getExpoUpdatesPlugin(): ExpoPluginEntry {
	return ['expo-updates', { username: EXPO_UPDATES_USERNAME }];
}

/** The expo-splash-screen plugin entry - same geometry in every app. */
export function getExpoSplashScreenPlugin(options: { image: string; backgroundColor: string }): ExpoPluginEntry {
	return [
		'expo-splash-screen',
		{
			image: options.image,
			imageWidth: 200,
			resizeMode: 'contain',
			backgroundColor: options.backgroundColor,
		},
	];
}

/**
 * The expo-image-picker plugin entry for the apps that let users attach photos
 * of meals (apps/frontend, apps/geonexia). The microphone permission is
 * switched off - the picker never records audio, and asking for it would raise
 * App Review questions.
 */
export function getMealPhotoImagePickerPlugin(): ExpoPluginEntry {
	return [
		'expo-image-picker',
		{
			photosPermission:
				'This app needs access to your photo library to capture and manage meal photos as part of the core digital meal plan functionality. Photos are essential for documenting meals in our canteen and restaurant management system.',
			cameraPermission:
				'This app needs camera access to take photos of meals for the digital meal plan management system. Camera functionality is core to documenting and tracking meals in canteens and restaurants.',
			'//': 'Disables the microphone permission',
			microphonePermission: false,
		},
	];
}

/** The `updates` section of an Expo config, derived from the EAS project id. */
export function getUpdatesConfig(easUpdateId: string | undefined) {
	return {
		enabled: true,
		url: 'https://u.expo.dev/' + easUpdateId,
		fallbackToCacheTimeout: UPDATES_FALLBACK_TO_CACHE_TIMEOUT_MS,
	};
}

/**
 * The `runtimeVersion` section of an Expo config.
 *
 * Production builds are tied to the app version, but Expo Go only loads
 * updates whose runtime version has the exposdk:<version> form. The PR preview
 * workflow publishes an additional update with EXPO_GO_PREVIEW=true so PRs can
 * be tested in Expo Go.
 */
export function getRuntimeVersion() {
	return {
		policy: (process.env.EXPO_GO_PREVIEW === 'true' ? 'sdkVersion' : 'appVersion') as 'sdkVersion' | 'appVersion',
	};
}

/** The `web` section of an Expo config - identical apart from the favicon. */
export function getWebConfig(favicon: string) {
	return {
		bundler: 'metro' as const,
		output: 'static' as const,
		favicon,
	};
}

export type PrivacyCollectedDataType = {
	NSPrivacyCollectedDataType: string;
	NSPrivacyCollectedDataTypeLinked: boolean;
	NSPrivacyCollectedDataTypeTracking: boolean;
	NSPrivacyCollectedDataTypePurposes: string[];
};

export type PrivacyAccessedApiType = {
	NSPrivacyAccessedAPIType: string;
	NSPrivacyAccessedAPITypeReasons: string[];
};

/**
 * Required-reason APIs used by the React Native/Expo SDK internals themselves
 * (UserDefaults, boot time, disk space, file timestamps). Every app hits these
 * regardless of its own features, so the list is shared.
 */
export const PRIVACY_ACCESSED_API_TYPES_EXPO_RUNTIME: PrivacyAccessedApiType[] = [
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
];

/**
 * Data an account-based app collects on behalf of its backend: location,
 * messages, photos, other user content and the account's email address
 * (apps/frontend, apps/geonexia). Apps that keep everything on the device
 * (apps/score-tracker, apps/tag-und-jahr) collect nothing and pass no
 * collected data types at all.
 */
export const PRIVACY_COLLECTED_DATA_TYPES_ACCOUNT_BASED: PrivacyCollectedDataType[] = [
	{
		NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePreciseLocation',
		NSPrivacyCollectedDataTypeLinked: false,
		NSPrivacyCollectedDataTypeTracking: false,
		NSPrivacyCollectedDataTypePurposes: [
			'NSPrivacyCollectedDataTypePurposeProductPersonalization',
			'NSPrivacyCollectedDataTypePurposeAppFunctionality',
			'NSPrivacyCollectedDataTypePurposeOther',
		],
	},
	{
		NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeEmailsOrTextMessages',
		NSPrivacyCollectedDataTypeLinked: true,
		NSPrivacyCollectedDataTypeTracking: false,
		NSPrivacyCollectedDataTypePurposes: [
			'NSPrivacyCollectedDataTypePurposeProductPersonalization',
			'NSPrivacyCollectedDataTypePurposeAppFunctionality',
		],
	},
	{
		NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePhotosorVideos',
		NSPrivacyCollectedDataTypeLinked: true,
		NSPrivacyCollectedDataTypeTracking: false,
		NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
	},
	{
		NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeOtherUserContent',
		NSPrivacyCollectedDataTypeLinked: true,
		NSPrivacyCollectedDataTypeTracking: false,
		NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
	},
	{
		NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeEmailAddress',
		NSPrivacyCollectedDataTypeLinked: true,
		NSPrivacyCollectedDataTypeTracking: false,
		NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
	},
];

/**
 * The `ios.privacyManifests` section (required for App Review). Pass the data
 * types the app collects - apps that store everything locally pass nothing.
 * The accessed-API reasons are always the shared Expo runtime ones.
 */
export function getPrivacyManifests(collectedDataTypes: PrivacyCollectedDataType[] = []) {
	return {
		NSPrivacyCollectedDataTypes: collectedDataTypes,
		NSPrivacyAccessedAPITypes: PRIVACY_ACCESSED_API_TYPES_EXPO_RUNTIME,
	};
}
