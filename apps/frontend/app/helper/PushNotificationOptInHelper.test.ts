import { countPushNotificationOptInSubmission, getPushNotificationOptInAction, getPushNotificationPermissionStep, readPushNotificationOptInState, recordPushNotificationOptInDecline } from './PushNotificationOptInHelper';

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
	const firstTime = countPushNotificationOptInSubmission(readPushNotificationOptInState(null));

	it.each(['ios', 'android'])('explains first on %s', platform => {
		expect(getPushNotificationOptInAction({ platform, permission: undetermined, state: firstTime })).toBe('explain');
	});

	it('does nothing on web', () => {
		expect(getPushNotificationOptInAction({ platform: 'web', permission: undetermined, state: firstTime })).toBe('none');
	});

	it('only syncs the token when the permission is already granted', () => {
		expect(getPushNotificationOptInAction({ platform: 'ios', permission: granted, state: firstTime })).toBe('sync');
	});

	it('does not ask when the system no longer allows asking', () => {
		expect(getPushNotificationOptInAction({ platform: 'ios', permission: blocked, state: firstTime })).toBe('none');
	});

	it('after every no asks again only at twice the count: 1, 2, 4, 8, 16', () => {
		let state = readPushNotificationOptInState(undefined);
		const askedAt: number[] = [];
		for (let time = 1; time <= 20; time++) {
			state = countPushNotificationOptInSubmission(state);
			if (getPushNotificationOptInAction({ platform: 'ios', permission: undetermined, state }) === 'explain') {
				askedAt.push(state.count);
				state = recordPushNotificationOptInDecline(state);
			}
		}
		expect(askedAt).toEqual([1, 2, 4, 8, 16]);
		expect(state.declines).toBe(5);
	});
});

describe('readPushNotificationOptInState', () => {
	it('starts so that the first time is asked', () => {
		expect(readPushNotificationOptInState(null)).toEqual({ count: 0, declines: 0, nextAskAt: 1 });
	});

	it('keeps a stored state and drops unusable values', () => {
		expect(readPushNotificationOptInState({ count: 5, declines: 2, nextAskAt: 8 })).toEqual({ count: 5, declines: 2, nextAskAt: 8 });
		expect(readPushNotificationOptInState({ count: -1, declines: 'x', nextAskAt: 0 })).toEqual({ count: 0, declines: 0, nextAskAt: 1 });
		expect(readPushNotificationOptInState('garbage')).toEqual({ count: 0, declines: 0, nextAskAt: 1 });
	});
});
