import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import type { AvatarConfig } from 'repo-depkit-common-ui';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Friend = {
	id: string;
	name: string;
	color: string;
	avatarConfig?: AvatarConfig;
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
