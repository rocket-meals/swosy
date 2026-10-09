import { getPushNotificationOptInAction, PUSH_NOTIFICATION_OPT_IN_ASK_AGAIN_AFTER_MS } from './PushNotificationOptInHelper';

const now = new Date('2026-10-09T12:00:00.000Z');
const undetermined = { granted: false, canAskAgain: true };

describe('getPushNotificationOptInAction', () => {
	it('explains first on iOS before the one-time system dialog', () => {
		expect(getPushNotificationOptInAction({ platform: 'ios', permission: undetermined, lastAskedAt: null, now })).toBe('explain');
	});

	it('asks the system directly on Android', () => {
		expect(getPushNotificationOptInAction({ platform: 'android', permission: undetermined, lastAskedAt: null, now })).toBe('request');
	});

	it('does nothing on web', () => {
		expect(getPushNotificationOptInAction({ platform: 'web', permission: undetermined, lastAskedAt: null, now })).toBe('none');
	});

	it('only syncs the token when the permission is already granted', () => {
		expect(getPushNotificationOptInAction({ platform: 'ios', permission: { granted: true, canAskAgain: true }, lastAskedAt: null, now })).toBe('sync');
	});

	it('does not ask when the system no longer allows asking', () => {
		expect(getPushNotificationOptInAction({ platform: 'ios', permission: { granted: false, canAskAgain: false }, lastAskedAt: null, now })).toBe('none');
	});

	it('does not ask again shortly after the last time', () => {
		const lastAskedAt = new Date(now.getTime() - 60 * 1000).toISOString();
		expect(getPushNotificationOptInAction({ platform: 'ios', permission: undetermined, lastAskedAt, now })).toBe('none');
	});

	it('asks again once the waiting time has passed', () => {
		const lastAskedAt = new Date(now.getTime() - PUSH_NOTIFICATION_OPT_IN_ASK_AGAIN_AFTER_MS - 1).toISOString();
		expect(getPushNotificationOptInAction({ platform: 'ios', permission: undetermined, lastAskedAt, now })).toBe('explain');
	});

	it('ignores an unreadable stored date', () => {
		expect(getPushNotificationOptInAction({ platform: 'android', permission: undetermined, lastAskedAt: 'garbage', now })).toBe('request');
	});
});
