import { Platform } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Whether the expo-updates OTA API can actually be called in the current runtime.
 *
 * Web has no update channel, and a development build runs behind
 * expo-dev-launcher, whose controller rejects every Updates.* call with
 * `NotAvailableInDevClientException: Updates.checkForUpdateAsync() is not
 * supported in development builds`. Checking this up front instead of catching
 * that rejection keeps the dev console free of an error that can never be
 * fixed at runtime. `Updates.isEnabled` additionally covers builds made
 * without an updates configuration.
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
