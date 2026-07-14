import { File, Paths } from 'expo-file-system';
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

// ─── File access ──────────────────────────────────────────────────────────────

function getFriendsFile(): File {
	return new File(Paths.document, 'score-tracker-friends.json');
}

/**
 * Persist the friends roster to disk.
 */
export function saveFriends(friends: Friend[]): void {
	try {
		getFriendsFile().write(JSON.stringify({ friends }));
	} catch (err) {
		console.warn('[FriendsStorage] Failed to save friends:', err);
	}
}

/**
 * Load the persisted friends roster from disk.
 */
export async function loadFriends(): Promise<Friend[]> {
	try {
		const file = getFriendsFile();
		if (!file.exists) return [];
		const content = await file.text();
		const parsed = JSON.parse(content) as Partial<FriendsState>;
		if (Array.isArray(parsed.friends)) return parsed.friends;
		return [];
	} catch {
		return [];
	}
}
