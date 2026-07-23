// Dismiss state for AppDownloadBanner. Lives in sessionStorage (web only, tab-scoped)
// rather than AsyncStorage/redux-persist, since it's meant to reset on every new
// browser session rather than survive indefinitely.
//
// NOTE: also cleared explicitly in helper/logoutHelper.ts - see the reminder
// comment there for why every new persisted storage key needs this.
const STORAGE_KEY = 'appDownloadBannerDismissed';

const hasSessionStorage = () => typeof sessionStorage !== 'undefined';

export const isAppDownloadBannerDismissed = (): boolean => {
	try {
		return hasSessionStorage() && sessionStorage.getItem(STORAGE_KEY) === 'true';
	} catch {
		return false;
	}
};

export const dismissAppDownloadBanner = (): void => {
	try {
		if (hasSessionStorage()) {
			sessionStorage.setItem(STORAGE_KEY, 'true');
		}
	} catch {
		// sessionStorage unavailable (e.g. blocked) - banner stays dismissed for this render only
	}
};

export const clearAppDownloadBannerDismissed = (): void => {
	try {
		if (hasSessionStorage()) {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	} catch {
		// ignore - nothing to clear if sessionStorage is unavailable
	}
};
