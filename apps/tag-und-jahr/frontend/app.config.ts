import type { ConfigContext, ExpoConfig } from '@expo/config';

// Register ts-node so Expo can load TypeScript config helpers without a
// precompiled JavaScript file.
require('repo-depkit-common/appconfig/registerTsNode.js').registerTsNode();

const { getBuildNumber, getVersion } = require('./config.ts');
const { collectLicenses } = require('repo-depkit-common/licenses/collectLicenses.ts');
// Settings that are deliberately identical in every app of this monorepo
// (iOS deployment target, Android SDK levels, OTA setup, privacy manifest
// boilerplate) live in repo-depkit-common/appconfig.
const {
	EXPO_OWNER,
	getExpoBuildPropertiesPlugin,
	getExpoSplashScreenPlugin,
	getExpoUpdatesPlugin,
	getPrivacyManifests,
	getRuntimeVersion,
	getUpdatesConfig,
	getWebConfig,
} = require('repo-depkit-common/appconfig/expoAppConfig.ts');

// Created by the first tag-und-jahr-expo-update CI run (eas init), see
// https://expo.dev/accounts/baumgartner-software/projects/tag-und-jahr
const EAS_PROJECT_ID = '354220f2-0d5a-46a0-bf47-15d8433432a9';

module.exports = function getExpoConfig({ config }: ConfigContext): ExpoConfig {
	const buildNumber = getBuildNumber();
	return {
		...config,
		owner: EXPO_OWNER,
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
			// no data off-device - everything happens locally, so no collected
			// data types are declared.
			privacyManifests: getPrivacyManifests(),
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/icons/app_icon_source.png',
				backgroundColor: '#5d6b85',
			},
			package: 'de.baumgartnersoftware.tagundjahr',
			versionCode: buildNumber,
		},
		web: getWebConfig('./assets/icons/app_icon_source.png'),
		updates: getUpdatesConfig(EAS_PROJECT_ID),
		runtimeVersion: getRuntimeVersion(),
		plugins: [
			'expo-router',
			getExpoSplashScreenPlugin({ image: './assets/icons/app_icon_source.png', backgroundColor: '#5d6b85' }),
			getExpoUpdatesPlugin(),
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
						{
							// Must match the name passed to createWidget in
							// widgets/FoodWidget.tsx. Experimental: shows today's meals of
							// a canteen picked in the app settings.
							name: 'FoodWidget',
							displayName: 'Speisen heute',
							description: 'Zeigt die Speisen des heutigen Tages der gewählten Mensa (experimentell).',
							ios: {
								supportedFamilies: ['systemSmall', 'systemMedium', 'systemLarge'],
								// Pure photo grid - the images should fill the widget, so the
								// system margins are disabled.
								contentMarginsDisabled: true,
								initialLayout: 'widgets/FoodWidget.tsx',
							},
						},
					],
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
			// Open-source dependency versions of this app and of its workspace
			// packages, collected from node_modules at config-evaluation time
			// (expo start / export / build / update) and read at runtime via
			// Constants.expoConfig.extra.licenses.
			licenses: collectLicenses(__dirname),
		}
	};
};
