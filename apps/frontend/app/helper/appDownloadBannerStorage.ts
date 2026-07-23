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

// Kiosk latch: kiosk mode is detected from the ?kioskMode=true URL param, which
// can get lost on internal navigation. The banner must NEVER show on a kiosk
// device, so once kiosk mode was seen in this browser session we remember it
// here and keep the banner hidden for the rest of the session.
// Intentionally NOT cleared in logoutHelper.ts: a kiosk device stays a kiosk
// device across the auto-logouts between visitors, and this flag only ever
// hides a promotional banner.
const KIOSK_SEEN_KEY = 'appDownloadBannerKioskModeSeen';

export const rememberKioskModeForSession = (): void => {
	try {
		if (hasSessionStorage()) {
			sessionStorage.setItem(KIOSK_SEEN_KEY, 'true');
		}
	} catch {
		// sessionStorage unavailable - the URL param check still applies per render
	}
};

export const wasKioskModeSeenThisSession = (): boolean => {
	try {
		return hasSessionStorage() && sessionStorage.getItem(KIOSK_SEEN_KEY) === 'true';
	} catch {
		return false;
	}
};
