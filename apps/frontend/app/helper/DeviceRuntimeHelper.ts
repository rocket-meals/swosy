import { areExpoUpdatesAvailable as areExpoUpdatesAvailableInRuntime } from 'repo-depkit-common-ui';
import { UrlHelper } from '@/constants/UrlHelper';

export function isInExpoGo() {
	const urlToLogin = UrlHelper.getURLToLogin();
	return urlToLogin.startsWith('exp://');
}

/**
 * Whether an OTA update check may be started. Wraps the shared common-ui check
 * (native platform, no development build, updates configured) with this app's
 * own Expo Go detection, which recognises the `exp://` login URL.
 */
export function areExpoUpdatesAvailable(): boolean {
	return !isInExpoGo() && areExpoUpdatesAvailableInRuntime();
}
