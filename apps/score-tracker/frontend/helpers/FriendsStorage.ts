import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import type { PlayerIdentity } from './PlayerIdentity';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Friend = PlayerIdentity & {
	id: string;
	createdAt: number;
};

export type FriendsState = {
	friends: Friend[];
};

// ─── Storage access ───────────────────────────────────────────────────────────

const FRIENDS_KEY = 'score-tracker-friends.json';

/**
 * Persist the friends roster to disk.
 */
export async function saveFriends(friends: Friend[]): Promise<void> {
	try {
		await setStorageItem(FRIENDS_KEY, JSON.stringify({ friends }));
	} catch (err) {
		console.warn('[FriendsStorage] Failed to save friends:', err);
	}
}

/**
 * Load the persisted friends roster from disk.
 */
export async function loadFriends(): Promise<Friend[]> {
	try {
		const raw = await getStorageItem(FRIENDS_KEY);
		if (raw === null) return [];
		const parsed = JSON.parse(raw) as Partial<FriendsState>;
		if (Array.isArray(parsed.friends)) return parsed.friends;
		return [];
	} catch {
		return [];
	}
}

// ─── Import/export ──────────────────────────────────────────────────────────

export function isValidFriend(value: unknown): value is Friend {
	if (typeof value !== 'object' || value === null) return false;
	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.id === 'string' &&
		typeof candidate.name === 'string' &&
		typeof candidate.color === 'string' &&
		typeof candidate.createdAt === 'number'
	);
}

/**
 * Parse a friends-export JSON string (as produced by `JSON.stringify` on a
 * `Friend[]`, e.g. the "Freunde exportieren" clipboard payload) for import.
 * Returns the parsed list, or `null` if the text isn't a valid export.
 */
export function parseFriendsExport(text: string): Friend[] | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		return null;
	}
	return parseFriendsValue(parsed);
}

/**
 * Same validation as `parseFriendsExport`, but starting from an already parsed
 * value - for callers that carry friends nested inside a larger JSON payload
 * (see helpers/ShareCodec).
 */
export function parseFriendsValue(parsed: unknown): Friend[] | null {
	if (!Array.isArray(parsed) || parsed.length === 0) return null;
	if (!parsed.every(isValidFriend)) return null;
	return parsed;
}
