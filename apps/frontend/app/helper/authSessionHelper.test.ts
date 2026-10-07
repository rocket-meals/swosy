import { buildProfileRestoreAfterSessionExpiry, isAccessTokenExpiring, isProfileReadAsOwner, isSessionRejectedError } from './authSessionHelper';

const PROFILE_ID = '55639afd-678c-441f-a0f5-a2e099855e25';

describe('isSessionRejectedError', () => {
	it('treats 400/401/403 answers from the server as a rejected session', () => {
		expect(isSessionRejectedError({ errors: [{ message: 'Invalid user credentials.' }], response: { status: 401 } })).toBe(true);
		expect(isSessionRejectedError({ errors: [], response: { status: 400 } })).toBe(true);
		expect(isSessionRejectedError({ errors: [], response: { status: 403 } })).toBe(true);
	});

	it('keeps the session on network and server errors', () => {
		expect(isSessionRejectedError(new TypeError('Network request failed'))).toBe(false);
		expect(isSessionRejectedError({ errors: [], response: { status: 503 } })).toBe(false);
		expect(isSessionRejectedError(undefined)).toBe(false);
	});

	it('falls back to the Directus error code when there is no response', () => {
		expect(isSessionRejectedError({ errors: [{ extensions: { code: 'TOKEN_EXPIRED' } }] })).toBe(true);
		expect(isSessionRejectedError({ errors: [{ extensions: { code: 'INTERNAL_SERVER_ERROR' } }] })).toBe(false);
	});
});

describe('isAccessTokenExpiring', () => {
	const now = 1_000_000;

	it('needs a refresh without access token or shortly before it expires', () => {
		expect(isAccessTokenExpiring({ access_token: null, refresh_token: 'r' }, now)).toBe(true);
		expect(isAccessTokenExpiring({ access_token: 'a', expires_at: now + 1000 }, now)).toBe(true);
		expect(isAccessTokenExpiring({ access_token: 'a', expires_at: now - 1 }, now)).toBe(true);
	});

	it('uses a valid access token as is', () => {
		expect(isAccessTokenExpiring({ access_token: 'a', expires_at: now + 10 * 60 * 1000 }, now)).toBe(false);
		expect(isAccessTokenExpiring({ access_token: 'a', expires_at: null }, now)).toBe(false);
	});
});

describe('isProfileReadAsOwner', () => {
	it('rejects the five fields the public role may read (real case from a feedback)', () => {
		const publicRead = { id: PROFILE_ID, nickname: null, date_updated: '2025-05-21T10:00:17.073Z', date_created: '2025-02-26T11:10:41.702Z', avatar: null };
		expect(isProfileReadAsOwner(publicRead)).toBe(false);
	});

	it('accepts a profile read as its owner, also without any markings', () => {
		expect(isProfileReadAsOwner({ id: PROFILE_ID, markings: [] })).toBe(true);
	});
});

describe('buildProfileRestoreAfterSessionExpiry', () => {
	const serverProfile = {
		id: PROFILE_ID,
		canteen: 'canteen-a',
		price_group: null,
		markings: [
			{ id: 8310, markings_id: 'vegan', like: true, profiles_id: PROFILE_ID },
			{ id: 8312, markings_id: 'pork', like: false, profiles_id: PROFILE_ID },
		],
	};

	it('transfers markings changed while the session was dead and keeps existing row ids', () => {
		const localProfile = {
			id: PROFILE_ID,
			canteen: 'canteen-a',
			markings: [
				{ markings_id: 'vegan', like: true, profiles_id: PROFILE_ID },
				{ markings_id: 'pork', like: true, profiles_id: PROFILE_ID },
				{ markings_id: 'fish', like: false, profiles_id: PROFILE_ID },
			],
		};

		const restore = buildProfileRestoreAfterSessionExpiry(serverProfile, localProfile);

		expect(restore?.markings).toEqual([
			{ id: 8310, markings_id: 'vegan', like: true, profiles_id: PROFILE_ID },
			{ id: 8312, markings_id: 'pork', like: true, profiles_id: PROFILE_ID },
			{ markings_id: 'fish', like: false, profiles_id: PROFILE_ID },
		]);
		expect(restore?.canteen).toBe('canteen-a');
	});

	it('transfers a canteen changed locally', () => {
		const restore = buildProfileRestoreAfterSessionExpiry(serverProfile, { id: PROFILE_ID, canteen: 'canteen-b', markings: serverProfile.markings });
		expect(restore?.canteen).toBe('canteen-b');
		expect(restore?.markings).toBe(serverProfile.markings);
	});

	it('never wipes the server markings with a local profile that was already overwritten by a public read', () => {
		const overwritten = { id: PROFILE_ID, nickname: null, date_updated: '2025-05-21T10:00:17.073Z', date_created: '2025-02-26T11:10:41.702Z', avatar: null };
		expect(buildProfileRestoreAfterSessionExpiry(serverProfile, overwritten)).toBeNull();
	});

	it('does nothing for another profile or when nothing differs', () => {
		expect(buildProfileRestoreAfterSessionExpiry(serverProfile, { ...serverProfile, id: 'other' })).toBeNull();
		expect(buildProfileRestoreAfterSessionExpiry(serverProfile, serverProfile)).toBeNull();
		expect(buildProfileRestoreAfterSessionExpiry(serverProfile, null)).toBeNull();
	});
});
