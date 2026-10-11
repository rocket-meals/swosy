import type { NotificationPermissionsStatus } from 'expo-notifications';

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

/** The things a user may get an answer to. Each is counted on its own. */
export enum PushNotificationOptInCategory {
	APP_FEEDBACK = 'app_feedback',
	FEATURE_WISH = 'feature_wish',
	FOOD_COMMENT = 'food_comment',
}

/**
 * Per category and device: how often the user did it (`count`), how often they said no to our
 * question (`declines`), and at which count we ask next (`nextAskAt`).
 */
export type PushNotificationOptInState = { count: number; declines: number; nextAskAt: number };

const INITIAL_OPT_IN_STATE: PushNotificationOptInState = { count: 0, declines: 0, nextAskAt: 1 };

function isCounter(value: unknown, min: number): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value >= min;
}

/** The stored state of a category, or the initial one (ask on the first time) when nothing usable is stored. */
export function readPushNotificationOptInState(stored: unknown): PushNotificationOptInState {
	const value = (stored ?? {}) as Partial<PushNotificationOptInState>;
	return {
		count: isCounter(value.count, 0) ? value.count : INITIAL_OPT_IN_STATE.count,
		declines: isCounter(value.declines, 0) ? value.declines : INITIAL_OPT_IN_STATE.declines,
		nextAskAt: isCounter(value.nextAskAt, 1) ? value.nextAskAt : INITIAL_OPT_IN_STATE.nextAskAt,
	};
}

/** The user did it once more. */
export function countPushNotificationOptInSubmission(state: PushNotificationOptInState): PushNotificationOptInState {
	return { ...state, count: state.count + 1 };
}

/**
 * At which counts we ask, at the start. After the last entry the count doubles with every no.
 * Food comments come much more often and many just want to leave their opinion without waiting
 * for an answer, so they get a larger gap than app feedbacks and feature wishes.
 */
export const PUSH_NOTIFICATION_OPT_IN_ASK_COUNTS: Record<PushNotificationOptInCategory, readonly number[]> = {
	[PushNotificationOptInCategory.APP_FEEDBACK]: [1],
	[PushNotificationOptInCategory.FEATURE_WISH]: [1],
	[PushNotificationOptInCategory.FOOD_COMMENT]: [1, 3, 10, 20, 40],
};

/**
 * The user said no: we ask again at the next count of the category, after the list only when
 * they did it twice as often as now (app feedback 1, 2, 4, 8, ..., food comment 1, 3, 10, 20, 40, 80, ...).
 */
export function recordPushNotificationOptInDecline(state: PushNotificationOptInState, category: PushNotificationOptInCategory): PushNotificationOptInState {
	const nextListed = PUSH_NOTIFICATION_OPT_IN_ASK_COUNTS[category].find(askCount => askCount > state.count);
	return { ...state, declines: state.declines + 1, nextAskAt: nextListed ?? Math.max(1, state.count) * 2 };
}

/**
 * What to do when a user with a profile did something they may get an answer to (app feedback,
 * feature wish, comment). `state` already counts this time. Unlike an explicit switch this is our
 * suggestion: it is asked on the first time and, after every no, only at the next count of
 * {@link recordPushNotificationOptInDecline} (by count, not after a time). It never sends anyone to the settings:
 * - `none`: nothing,
 * - `sync`: permission already granted, only make sure the backend knows the push token,
 * - `explain`: show our own modal first, then the system dialog.
 */
export type PushNotificationOptInAction = 'none' | 'sync' | 'explain';

export function getPushNotificationOptInAction(opts: { platform: string; permission: PermissionState; state: PushNotificationOptInState }): PushNotificationOptInAction {
	const { platform, permission, state } = opts;
	const step = getPushNotificationPermissionStep({ platform, permission });
	if (step === 'granted') {
		return 'sync';
	}
	if (step !== 'explain') {
		return 'none';
	}
	return state.count >= state.nextAskAt ? 'explain' : 'none';
}
