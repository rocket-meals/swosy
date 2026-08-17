import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { UrlHelper } from '@/constants/UrlHelper';

export function isInExpoGo() {
	const urlToLogin = UrlHelper.getURLToLogin();
	return urlToLogin.startsWith('exp://');
}

/**
 * Whether the expo-updates OTA API can actually be called in the current runtime.
 *
 * Only release builds installed from a store (or from an internal distribution
 * build) ship the real update controller. Web has no updates at all, Expo Go
 * ignores them, and a development build runs behind expo-dev-launcher, whose
 * controller rejects every Updates.* call with
 * `NotAvailableInDevClientException: Updates.checkForUpdateAsync() is not
 * supported in development builds`. Checking this up front instead of catching
 * that rejection keeps the dev console free of an error that can never be
 * fixed at runtime.
 */
export function areExpoUpdatesAvailable(): boolean {
	if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
		return false;
	}

	if (__DEV__ || isInExpoGo()) {
		return false;
	}

	// False when expo-updates is not configured for the build, so this also
	// covers bare debug builds that were made without the dev launcher.
	return Updates.isEnabled === true;
}

/**
 * True for rejections that mean "this runtime has no OTA updates" rather than
 * "the update check failed". Those are expected, so callers log them quietly
 * instead of as errors.
 */
export function isExpoUpdatesUnavailableError(error: unknown): boolean {
	const description = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
	return /NotAvailableInDevClient|ERR_UPDATES_DISABLED|not supported in development/i.test(description);
}
