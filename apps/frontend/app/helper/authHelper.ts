import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import usePlatformHelper from './platformHelper';

const preferInkognitoMode = true;

export const handleWebLogin = async (loginUrl: string, redirectUrl: string, codeVerifier: string, getToken: (codeVerifier: string, code: string) => void) => {
	const WEB_CHECK_INTERVAL = 25;
	const windowFeatures = preferInkognitoMode
		? 'width=500,height=600,noopener,noreferrer'
		: 'width=500,height=600';

	return new Promise<void>(resolve => {
		const authWindow = window.open(loginUrl, '_blank', windowFeatures);
		const authCheckInterval = setInterval(() => {
			if (authWindow) {
				if (authWindow?.closed) {
					clearInterval(authCheckInterval);
					resolve();
				} else {
					try {
						const currentLocation = new URL(authWindow.location.href);
						if (currentLocation.href.startsWith(redirectUrl)) {
							authWindow.close();
							const code = new URLSearchParams(currentLocation.search).get('code');
							if (code) getToken(codeVerifier, code);
							clearInterval(authCheckInterval);
							resolve();
						}
					} catch {
						// Cross-origin access error during redirect, ignored.
					}
				}
			}
		}, WEB_CHECK_INTERVAL);
	});
};

export const handleNativeLogin = async (loginUrl: string, redirectUrl: string, codeVerifier: string, getToken: (codeVerifier: string, code: string) => void) => {
	const { getAndroidPreferredBrowserPackageOption } = usePlatformHelper();
	const isAndroid = Platform.OS === 'android';
	let result = null;

	if (isAndroid) {
		const { browserPackage } = await getAndroidPreferredBrowserPackageOption();
		result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUrl, {
			browserPackage,
			preferEphemeralSession: preferInkognitoMode,
		});
	} else {
		result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUrl, {
			preferEphemeralSession: preferInkognitoMode,
		});
	}

	if (result?.type === 'success' && result.url) {
		const code = new URLSearchParams(new URL(result.url).search).get('code');
		if (code) getToken(codeVerifier, code);
	}
};
