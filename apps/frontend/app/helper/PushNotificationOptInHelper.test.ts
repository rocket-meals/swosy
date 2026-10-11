import { countPushNotificationOptInSubmission, getPushNotificationOptInAction, getPushNotificationPermissionStep, PushNotificationOptInCategory, readPushNotificationOptInState, recordPushNotificationOptInDecline } from './PushNotificationOptInHelper';

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

	function askedAtWhenAlwaysDeclined(category: PushNotificationOptInCategory, times: number) {
		let state = readPushNotificationOptInState(undefined);
		const askedAt: number[] = [];
		for (let time = 1; time <= times; time++) {
			state = countPushNotificationOptInSubmission(state);
			if (getPushNotificationOptInAction({ platform: 'ios', permission: undetermined, state }) === 'explain') {
				askedAt.push(state.count);
				state = recordPushNotificationOptInDecline(state, category);
			}
		}
		return { askedAt, declines: state.declines };
	}

	it.each([PushNotificationOptInCategory.APP_FEEDBACK, PushNotificationOptInCategory.FEATURE_WISH])('after every no asks %s again only at twice the count', category => {
		expect(askedAtWhenAlwaysDeclined(category, 20)).toEqual({ askedAt: [1, 2, 4, 8, 16], declines: 5 });
	});

	it('asks food comments with a larger gap, then doubles', () => {
		expect(askedAtWhenAlwaysDeclined(PushNotificationOptInCategory.FOOD_COMMENT, 200)).toEqual({ askedAt: [1, 3, 10, 20, 40, 80, 160], declines: 7 });
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
