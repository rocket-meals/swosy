import type { NotificationPermissionsStatus } from 'expo-notifications';

export const PUSH_NOTIFICATION_OPT_IN_ASK_AGAIN_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

type PermissionState = Pick<NotificationPermissionsStatus, 'granted' | 'canAskAgain'> | undefined;

/**
 * What to do when the user explicitly switches on something that needs push notifications
 * (food reminder, free apartments):
 * - `granted`: permission already there,
 * - `explain`: show our own modal first, then the system dialog. The system dialog can only be
 *   shown once on iOS and twice on Android 13+, so it is never spent without our explanation,
 * - `open_settings`: the system no longer lets us ask, only the system settings can help,
 * - `unsupported`: no system permission to ask for (web) or it could not be read.
 */
export type PushNotificationPermissionStep = 'granted' | 'explain' | 'open_settings' | 'unsupported';

export function getPushNotificationPermissionStep(opts: { platform: string; permission: PermissionState }): PushNotificationPermissionStep {
	const { platform, permission } = opts;
	if (platform === 'web' || !permission) {
		return 'unsupported';
	}
	if (permission.granted) {
		return 'granted';
	}
	if (permission.canAskAgain === false) {
		return 'open_settings';
	}
	return 'explain';
}

/**
 * What to do when a user with a profile did something they may get an answer to (app feedback,
 * feature wish, comment). Unlike an explicit switch this is our suggestion, so it is not repeated
 * within {@link PUSH_NOTIFICATION_OPT_IN_ASK_AGAIN_AFTER_MS} and never sends anyone to the settings:
 * - `none`: nothing,
 * - `sync`: permission already granted, only make sure the backend knows the push token,
 * - `explain`: show our own modal first, then the system dialog.
 */
export type PushNotificationOptInAction = 'none' | 'sync' | 'explain';

export function getPushNotificationOptInAction(opts: { platform: string; permission: PermissionState; lastAskedAt: unknown; now: Date }): PushNotificationOptInAction {
	const { platform, permission, lastAskedAt, now } = opts;
	const step = getPushNotificationPermissionStep({ platform, permission });
	if (step === 'granted') {
		return 'sync';
	}
	if (step !== 'explain') {
		return 'none';
	}
	if (typeof lastAskedAt === 'string') {
		const lastAskedTime = new Date(lastAskedAt).getTime();
		if (!Number.isNaN(lastAskedTime) && now.getTime() - lastAskedTime < PUSH_NOTIFICATION_OPT_IN_ASK_AGAIN_AFTER_MS) {
			return 'none';
		}
	}
	return 'explain';
}
