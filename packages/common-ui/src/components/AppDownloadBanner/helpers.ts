import { Platform } from 'react-native';
import { useEffect, useState } from 'react';

export type MobileWebPlatform = 'ios' | 'android' | null;

/**
 * Returns 'ios' | 'android' when the code runs in a mobile web browser,
 * otherwise null (native apps, desktop browsers, SSR).
 */
export const getMobileWebPlatform = (): MobileWebPlatform => {
	if (Platform.OS !== 'web' || typeof navigator === 'undefined') return null;
	const userAgent = navigator.userAgent || '';
	if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
	if (/Android/i.test(userAgent)) return 'android';
	return null;
};

/**
 * True when the web app itself already runs as an installed (standalone) web
 * app - either added to the home screen on iOS (navigator.standalone) or
 * installed as a PWA (display-mode: standalone). In that case a download
 * banner makes no sense.
 */
export const isRunningAsInstalledWebApp = (): boolean => {
	if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
	try {
		// iOS Safari "Add to Home Screen"
		if ((navigator as unknown as { standalone?: boolean }).standalone === true) return true;
		// PWA installed via manifest (Android/Chrome, desktop)
		return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
	} catch {
		return false;
	}
};

/**
 * 'installed' when we could positively detect the native app on the device,
 * 'unknown' otherwise. There is deliberately no 'not-installed' state:
 * navigator.getInstalledRelatedApps() also returns an empty list when the
 * digital-asset-links verification between web origin and app is missing, so
 * an empty result must not be treated as proof of absence.
 */
export type NativeAppInstalledStatus = 'installed' | 'unknown';

type InstalledRelatedApp = { id?: string; platform?: string; url?: string };

/**
 * Detects whether the native (Android) app is installed on the current device.
 * Only works on Android/Chrome and only when the served web app manifest lists
 * the app under related_applications AND the native app declares matching
 * digital asset links - on all other platforms (notably iOS) the result stays
 * 'unknown'. iOS gets its installed-state handling for free via the
 * apple-itunes-app Smart App Banner meta tag instead.
 */
export const checkNativeAppInstalled = async (androidPackageName?: string): Promise<NativeAppInstalledStatus> => {
	if (Platform.OS !== 'web' || typeof navigator === 'undefined') return 'unknown';
	const getInstalledRelatedApps = (navigator as unknown as { getInstalledRelatedApps?: () => Promise<InstalledRelatedApp[]> }).getInstalledRelatedApps;
	if (typeof getInstalledRelatedApps !== 'function') return 'unknown';
	try {
		const relatedApps = await getInstalledRelatedApps.call(navigator);
		const installed = relatedApps?.some(app => (androidPackageName ? app.id === androidPackageName : true));
		return installed ? 'installed' : 'unknown';
	} catch {
		return 'unknown';
	}
};

/**
 * React hook wrapper around checkNativeAppInstalled().
 */
export const useNativeAppInstalledStatus = (androidPackageName?: string): NativeAppInstalledStatus => {
	const [status, setStatus] = useState<NativeAppInstalledStatus>('unknown');
	useEffect(() => {
		let mounted = true;
		checkNativeAppInstalled(androidPackageName).then(result => {
			if (mounted) setStatus(result);
		});
		return () => {
			mounted = false;
		};
	}, [androidPackageName]);
	return status;
};
