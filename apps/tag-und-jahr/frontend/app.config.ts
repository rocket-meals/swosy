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
		name: 'Tag und Jahr',
		slug: 'tag-und-jahr',
		version: getVersion(),
		orientation: 'default',
		icon: './assets/icons/app_icon_source.png',
		scheme: 'tag-und-jahr',
		userInterfaceStyle: 'automatic',
		ios: {
			supportsTablet: true,
			bundleIdentifier: 'de.baumgartner-software.day-and-year',
			buildNumber: buildNumber.toString(),
			config: {
				usesNonExemptEncryption: false,
			},
			// Apple privacy manifest (required for App Review): the app collects
			// no data off-device - everything happens locally. The accessed-API
			// reasons cover the React Native/Expo SDK internals (UserDefaults,
			// boot time, disk space, file timestamps), same as apps/score-tracker.
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
				backgroundColor: '#5d6b85',
			},
			package: 'de.baumgartnersoftware.tagundjahr',
			versionCode: buildNumber,
		},
		web: {
			bundler: 'metro',
			output: 'static',
			favicon: './assets/icons/app_icon_source.png',
		},
		updates: {
			enabled: true,
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
					backgroundColor: '#5d6b85',
				},
			],
			['expo-updates', { username: 'jack5496' }],
			'expo-font',
			[
				'expo-widgets',
				{
					widgets: [
						{
							// Must match the name passed to createWidget in
							// widgets/TagUndJahrWidget.tsx.
							name: 'TagUndJahrWidget',
							displayName: 'Tag und Jahr',
							description: 'Jahresscheibe mit Frühlingsmarke und Tagespunkt - ein Objekt zur Betrachtung vergehender Zeit.',
							ios: {
								supportedFamilies: ['systemSmall', 'systemMedium', 'systemLarge'],
								// The clock draws its own background disc; without the
								// system margins the disc can use the full widget canvas.
								contentMarginsDisabled: true,
								// Lets the widget gallery render the clock before the app
								// has been opened for the first time.
								initialLayout: 'widgets/TagUndJahrWidget.tsx',
							},
						},
					],
				},
			],
		],
		experiments: {
			typedRoutes: true,
		},
		extra: {
			// Open-source dependency versions of this app and of its workspace
			// packages, collected from node_modules at config-evaluation time
			// (expo start / export / build / update) and read at runtime via
			// Constants.expoConfig.extra.licenses.
			licenses: collectLicenses(__dirname),
		}
	};
};
