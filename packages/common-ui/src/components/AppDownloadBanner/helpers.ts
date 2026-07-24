import { Platform } from 'react-native';

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
