/**
 * Pure helpers around the Directus login session. Kept free of React Native imports so they
 * can be unit-tested in Node.
 *
 * Background (feedback "Essgewohnheiten setzen sich immer zurück", Oct 2026): when a token
 * refresh failed, the Directus SDK had already wiped the stored tokens and silently sent every
 * following request without `Authorization`. The app still showed the user as logged in, but
 * the server answered as the public role: profile PATCHes were rejected, and the profile read
 * only returned the five public fields - which then replaced the local profile including the
 * user's eating habits.
 */

export type StoredAuthData = {
	access_token?: string | null;
	refresh_token?: string | null;
	expires?: number | null;
	expires_at?: number | null;
} | null | undefined;

/** Refresh this long before the access token actually expires (same margin as the SDK). */
export const ACCESS_TOKEN_REFRESH_MARGIN_MS = 30000;

/** HTTP statuses with which Directus rejects a refresh token or an unauthenticated request. */
const SESSION_REJECTED_STATUSES = new Set([400, 401, 403]);

/** Directus error codes that mean "this session is not (or no longer) valid". */
const SESSION_REJECTED_CODES = new Set(['INVALID_CREDENTIALS', 'INVALID_TOKEN', 'TOKEN_EXPIRED', 'FORBIDDEN', 'INVALID_PAYLOAD']);

/** True when there is a refresh token, i.e. the session can still be renewed. */
export function hasRefreshToken(data: StoredAuthData): boolean {
	return !!data?.refresh_token;
}

/** True when the access token is missing or about to expire and has to be refreshed first. */
export function isAccessTokenExpiring(data: StoredAuthData, now: number = Date.now()): boolean {
	if (!data?.access_token) return true;
	if (data.expires_at === null || data.expires_at === undefined) return false;
	return data.expires_at < now + ACCESS_TOKEN_REFRESH_MARGIN_MS;
}

/**
 * True when the server answered and rejected the session (expired/revoked refresh token,
 * request without permission). False for network errors and server errors (5xx): then the
 * session may still be fine and must be kept for the next attempt - otherwise a single
 * request while offline would log the user out for good.
 */
export function isSessionRejectedError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const response = (error as { response?: { status?: unknown } }).response;
	if (typeof response?.status === 'number') {
		return SESSION_REJECTED_STATUSES.has(response.status);
	}
	const errors = (error as { errors?: unknown }).errors;
	if (Array.isArray(errors)) {
		return errors.some(entry => {
			const code = (entry as { extensions?: { code?: unknown } } | null)?.extensions?.code;
			return typeof code === 'string' && SESSION_REJECTED_CODES.has(code);
		});
	}
	return false;
}

/**
 * A profile read as its owner always contains `markings` (possibly empty). The public role may
 * only read `id, nickname, date_updated, date_created, avatar` - a response without `markings`
 * was therefore not read as the owner and must never replace the local profile.
 */
export function isProfileReadAsOwner(profile: unknown): boolean {
	return !!profile && typeof profile === 'object' && Array.isArray((profile as { markings?: unknown }).markings);
}

export class IncompleteProfileError extends Error {
	constructor() {
		super('Profile response is incomplete (not read as its owner) - the login session is probably no longer valid');
		this.name = 'IncompleteProfileError';
	}
}

type ProfileMarkingLike = {
	id?: number | null;
	markings_id?: unknown;
	like?: boolean | null;
	dislike?: boolean | null;
	profiles_id?: unknown;
};

type ProfileLike = {
	id?: unknown;
	canteen?: unknown;
	markings?: unknown;
	[key: string]: unknown;
};

function getMarkingId(marking: ProfileMarkingLike): string | null {
	const value = marking.markings_id;
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string') {
		return (value as { id: string }).id;
	}
	return null;
}

function toMarkingObjects(markings: unknown): ProfileMarkingLike[] {
	if (!Array.isArray(markings)) return [];
	return markings.filter((entry): entry is ProfileMarkingLike => !!entry && typeof entry === 'object');
}

function getCanteenId(canteen: unknown): string | null {
	if (typeof canteen === 'string') return canteen;
	if (canteen && typeof canteen === 'object' && typeof (canteen as { id?: unknown }).id === 'string') {
		return (canteen as { id: string }).id;
	}
	return null;
}

function markingsSignature(markings: ProfileMarkingLike[]): string {
	return markings
		.map(marking => `${getMarkingId(marking)}:${marking.like ?? ''}:${marking.dislike ?? ''}`)
		.sort()
		.join('|');
}

/**
 * After an expired session the user logs in again. Changes made locally while the session was
 * dead (eating habits, canteen) never reached the server. This builds the profile update that
 * transfers them onto the freshly loaded server profile - or returns null when there is nothing
 * to transfer (different profile, no local markings, or nothing differs).
 *
 * Local markings only count when they are an array: a local profile that was already
 * overwritten by a public-role read has no `markings` at all and must not wipe the server's.
 */
export function buildProfileRestoreAfterSessionExpiry(serverProfile: ProfileLike, localProfile: ProfileLike | null | undefined): ProfileLike | null {
	if (!localProfile || !serverProfile?.id || localProfile.id !== serverProfile.id) return null;

	const updates: ProfileLike = {};

	const localCanteenId = getCanteenId(localProfile.canteen);
	if (localCanteenId && localCanteenId !== getCanteenId(serverProfile.canteen)) {
		updates.canteen = localCanteenId;
	}

	if (Array.isArray(localProfile.markings)) {
		const serverMarkings = toMarkingObjects(serverProfile.markings);
		const localMarkings = toMarkingObjects(localProfile.markings).filter(marking => getMarkingId(marking));
		if (markingsSignature(localMarkings) !== markingsSignature(serverMarkings)) {
			updates.markings = localMarkings.map(localMarking => {
				const markingId = getMarkingId(localMarking);
				const existing = serverMarkings.find(serverMarking => getMarkingId(serverMarking) === markingId);
				const restored: ProfileMarkingLike = existing ? { ...existing } : { markings_id: markingId, profiles_id: serverProfile.id };
				restored.like = localMarking.like ?? null;
				if ('dislike' in localMarking) restored.dislike = localMarking.dislike ?? null;
				return restored;
			});
		}
	}

	if (Object.keys(updates).length === 0) return null;
	return { ...serverProfile, ...updates };
}

/** Login session state for the feedback snapshot - flags and dates only, never token values. */
export type SessionDiagnostics = {
	hasRefreshToken: boolean;
	hasAccessToken: boolean;
	accessTokenExpiresAt: string | null;
	accessTokenExpired: boolean | null;
};

/**
 * The tokens live outside redux (`auth_data` in SQLite / localStorage), so the redux snapshot
 * alone cannot tell whether the app still has a session - the case behind the feedback
 * "Essgewohnheiten setzen sich immer zurück" (`loggedIn: true`, but no refresh token).
 */
export function buildSessionDiagnostics(data: StoredAuthData, now: number = Date.now()): SessionDiagnostics {
	const expiresAt = typeof data?.expires_at === 'number' ? data.expires_at : null;
	return {
		hasRefreshToken: hasRefreshToken(data),
		hasAccessToken: !!data?.access_token,
		accessTokenExpiresAt: expiresAt === null ? null : new Date(expiresAt).toISOString(),
		accessTokenExpired: expiresAt === null ? null : expiresAt < now,
	};
}
