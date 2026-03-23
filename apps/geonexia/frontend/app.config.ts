import type { ConfigContext, ExpoConfig } from '@expo/config';

module.exports = function ({ config }: ConfigContext): ExpoConfig {
	return {
		...config,
		name: 'Geonexia',
		slug: 'geonexia',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/icon.png',
		scheme: 'geonexia',
		userInterfaceStyle: 'automatic',
		splash: {
			image: './assets/splash.png',
			resizeMode: 'contain',
			backgroundColor: '#ffffff',
		},
		ios: {
			supportsTablet: true,
			bundleIdentifier: 'com.geonexia.app',
		},
		android: {
			adaptiveIcon: {
				foregroundImage: './assets/adaptive-icon.png',
				backgroundColor: '#ffffff',
			},
			package: 'com.geonexia.app',
		},
		web: {
			bundler: 'metro',
			output: 'static',
			favicon: './assets/favicon.png',
		},
		plugins: [
			'expo-router',
			[
				'expo-splash-screen',
				{
					image: './assets/splash.png',
					imageWidth: 200,
					resizeMode: 'contain',
					backgroundColor: '#ffffff',
				},
			],
		],
		experiments: {
			typedRoutes: true,
		},
		extra: {
			eas: {
				projectId: '8fbc9283-a03b-4ca0-92cd-fcb87d2e64f4',
			},
		},
	};
};
