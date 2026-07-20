import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { getPlatformHelper } from './platformHelper';
import { fetchToken } from '@/redux/actions/ApiService/ApiService';

const preferInkognitoMode = true;

// On Android there is no native auth session: expo-web-browser emulates
// openAuthSessionAsync with a race between an AppState listener ("app became
// active again" -> {type: 'dismiss'}) and a Linking 'url' listener
// ({type: 'success'}). When the app resumes before the deep link event reaches
// JS - which reliably happens once Google/Directus sessions exist in the
// Custom Tab and the redirect chain completes instantly - the session resolves
// with 'dismiss' and its url listener is removed, silently dropping the auth
// code. iOS uses ASWebAuthenticationSession and is not affected.
// See https://github.com/expo/expo/issues/12044
//
// To be robust against this, the native login additionally:
// - registers its own Linking listener, which still receives the redirect
//   event even when the auth session already resolved with 'dismiss'
// - persists the PKCE code verifier, so the login screen can complete the
//   token exchange from the deep link (?code=...) even after an app restart
const CODE_VERIFIER_STORAGE_KEY = 'pkce_pending_code_verifier';
const DISMISS_GRACE_PERIOD_MS = 2000;

let inMemoryCodeVerifier: string | null = null;
// Codes are single-use on the backend; both completion paths (auth session
// result / own listener vs. login screen deep link params) guard against
// exchanging the same code twice.
const handledCodes = new Set<string>();

const isSecureStoreUsable = () => Platform.OS !== 'web';

const storePendingCodeVerifier = async (codeVerifier: string) => {
	inMemoryCodeVerifier = codeVerifier;
	if (!isSecureStoreUsable()) return;
	try {
		await SecureStore.setItemAsync(CODE_VERIFIER_STORAGE_KEY, codeVerifier);
	} catch (error) {
		console.error('Could not persist pending code verifier:', error);
	}
};

const getPendingCodeVerifier = async (): Promise<string | null> => {
	if (inMemoryCodeVerifier) return inMemoryCodeVerifier;
	if (!isSecureStoreUsable()) return null;
	try {
		return await SecureStore.getItemAsync(CODE_VERIFIER_STORAGE_KEY);
	} catch (error) {
		console.error('Could not read pending code verifier:', error);
		return null;
	}
};

const clearPendingCodeVerifier = async () => {
	inMemoryCodeVerifier = null;
	if (!isSecureStoreUsable()) return;
	try {
		await SecureStore.deleteItemAsync(CODE_VERIFIER_STORAGE_KEY);
	} catch (error) {
		console.error('Could not clear pending code verifier:', error);
	}
};

const getCodeFromUrl = (url: string): string | null => {
	try {
		return new URLSearchParams(new URL(url).search).get('code');
	} catch {
		return null;
	}
};

export const handleWebLogin = async (loginUrl: string, redirectUrl: string, codeVerifier: string, getToken: (codeVerifier: string, code: string) => void) => {
	const WEB_CHECK_INTERVAL = 25;

	return new Promise<void>(resolve => {
		const windowFeatures = 'width=500,height=600';
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
	const { getAndroidPreferredBrowserPackageOption } = getPlatformHelper();
	const isAndroid = Platform.OS === 'android';

	await storePendingCodeVerifier(codeVerifier);

	const tryHandleRedirect = (url: string | null | undefined): boolean => {
		if (!url?.startsWith(redirectUrl)) return false;
		const code = getCodeFromUrl(url);
		if (!code || handledCodes.has(code)) return false;
		handledCodes.add(code);
		clearPendingCodeVerifier();
		getToken(codeVerifier, code);
		return true;
	};

	const redirectSubscription = Linking.addEventListener('url', event => {
		tryHandleRedirect(event.url);
	});

	try {
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
			tryHandleRedirect(result.url);
		} else if (isAndroid && result?.type === 'dismiss') {
			// 'dismiss' can mean "redirect arrived but lost the internal race":
			// keep our listener alive a moment so a late deep link event can
			// still complete the login.
			await new Promise(resolve => setTimeout(resolve, DISMISS_GRACE_PERIOD_MS));
		}
	} finally {
		redirectSubscription.remove();
	}
};

// Completes the login when the auth redirect arrives as plain deep link
// navigation to the login screen (?code=...) instead of through the auth
// session, e.g. after the session resolved with 'dismiss' or the app was
// restarted while in the browser.
export const completeLoginFromDeepLinkCode = async (code: string, onToken: (directusRefreshToken: string) => void) => {
	if (!code || handledCodes.has(code)) return;
	const codeVerifier = await getPendingCodeVerifier();
	if (!codeVerifier) return;
	handledCodes.add(code);
	try {
		const { directus_refresh_token } = await fetchToken(codeVerifier, code);
		if (directus_refresh_token) {
			await clearPendingCodeVerifier();
			onToken(directus_refresh_token);
		}
	} catch (error) {
		console.error('Error completing login from deep link code:', error);
	}
};
