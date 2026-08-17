import { Platform } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Whether the expo-updates OTA API can actually be called in the current runtime.
 *
 * Only builds that ship the real update controller may call `Updates.*`:
 * - web has no update channel at all,
 * - a development build runs behind expo-dev-launcher, whose controller rejects
 *   every call with `NotAvailableInDevClientException: Updates.checkForUpdateAsync()
 *   is not supported in development builds`,
 * - Expo Go always runs a development bundle without an updates configuration,
 *   so it is covered by the same two checks,
 * - `Updates.isEnabled` is false when the build has no (or a broken) updates
 *   configuration, in which case only the embedded update is ever loaded.
 *
 * Checking this up front instead of catching the rejection keeps the console
 * free of an error that cannot be fixed at runtime.
 */
export function areExpoUpdatesAvailable(): boolean {
	if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
		return false;
	}

	if (__DEV__) {
		return false;
	}

	return Updates.isEnabled === true;
}

/**
 * True for rejections that mean "this runtime has no OTA updates" rather than
 * "the update check failed". Those are expected, so callers log them quietly
 * instead of as errors - a real update failure must stay visible.
 */
export function isExpoUpdatesUnavailableError(error: unknown): boolean {
	const description = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
	return /NotAvailableInDevClient|ERR_UPDATES_DISABLED|not supported in development/i.test(description);
}
