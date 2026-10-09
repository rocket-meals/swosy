import { getPushNotificationOptInAction, getPushNotificationPermissionStep, PUSH_NOTIFICATION_OPT_IN_ASK_AGAIN_AFTER_MS } from './PushNotificationOptInHelper';

const now = new Date('2026-10-09T12:00:00.000Z');
const undetermined = { granted: false, canAskAgain: true };
const granted = { granted: true, canAskAgain: true };
const blocked = { granted: false, canAskAgain: false };

describe('getPushNotificationPermissionStep', () => {
	it.each(['ios', 'android'])('explains first on %s before the system dialog', platform => {
		expect(getPushNotificationPermissionStep({ platform, permission: undetermined })).toBe('explain');
	});

	it('needs nothing when the permission is already granted', () => {
		expect(getPushNotificationPermissionStep({ platform: 'ios', permission: granted })).toBe('granted');
	});

	it('sends to the system settings when the system no longer allows asking', () => {
		expect(getPushNotificationPermissionStep({ platform: 'android', permission: blocked })).toBe('open_settings');
	});

	it('has no system permission on web or when it could not be read', () => {
		expect(getPushNotificationPermissionStep({ platform: 'web', permission: undetermined })).toBe('unsupported');
		expect(getPushNotificationPermissionStep({ platform: 'ios', permission: undefined })).toBe('unsupported');
	});
});

describe('getPushNotificationOptInAction', () => {
	it.each(['ios', 'android'])('explains first on %s', platform => {
		expect(getPushNotificationOptInAction({ platform, permission: undetermined, lastAskedAt: null, now })).toBe('explain');
	});

	it('does nothing on web', () => {
		expect(getPushNotificationOptInAction({ platform: 'web', permission: undetermined, lastAskedAt: null, now })).toBe('none');
	});

	it('only syncs the token when the permission is already granted', () => {
		expect(getPushNotificationOptInAction({ platform: 'ios', permission: granted, lastAskedAt: null, now })).toBe('sync');
	});

	it('does not ask when the system no longer allows asking', () => {
		expect(getPushNotificationOptInAction({ platform: 'ios', permission: blocked, lastAskedAt: null, now })).toBe('none');
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
		expect(getPushNotificationOptInAction({ platform: 'android', permission: undetermined, lastAskedAt: 'garbage', now })).toBe('explain');
	});
});
