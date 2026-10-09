import type { NotificationPermissionsStatus } from 'expo-notifications';

export const PUSH_NOTIFICATION_OPT_IN_ASK_AGAIN_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * What to do when a user with a profile did something they may get an answer to:
 * - `none`: nothing (web, already asked recently, or the system no longer lets us ask),
 * - `sync`: permission already granted, only make sure the backend knows the push token,
 * - `explain`: show our own modal first (iOS shows its system dialog only once),
 * - `request`: show the system dialog directly (Android can show it again).
 */
export type PushNotificationOptInAction = 'none' | 'sync' | 'explain' | 'request';

export function getPushNotificationOptInAction(opts: {
	platform: string;
	permission: Pick<NotificationPermissionsStatus, 'granted' | 'canAskAgain'> | undefined;
	lastAskedAt: unknown;
	now: Date;
}): PushNotificationOptInAction {
	const { platform, permission, lastAskedAt, now } = opts;
	if (platform === 'web' || !permission) {
		return 'none';
	}
	if (permission.granted) {
		return 'sync';
	}
	if (permission.canAskAgain === false) {
		return 'none';
	}
	if (typeof lastAskedAt === 'string') {
		const lastAskedTime = new Date(lastAskedAt).getTime();
		if (!Number.isNaN(lastAskedTime) && now.getTime() - lastAskedTime < PUSH_NOTIFICATION_OPT_IN_ASK_AGAIN_AFTER_MS) {
			return 'none';
		}
	}
	return platform === 'ios' ? 'explain' : 'request';
}
