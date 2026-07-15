import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import type { AvatarConfig } from 'repo-depkit-common-ui';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameHistoryPlayerEntry = {
	/** The archived game's transient `Player.id` - the key into `finalScores`. */
	playerId: string;
	/** Present when this participant was a friend at the time the game was archived. */
	friendId?: string;
	name: string;
	color: string;
	avatarConfig?: AvatarConfig;
};

export type GameHistoryEntry = {
	id: string;
	endedAt: number;
	roundsCount: number;
	players: GameHistoryPlayerEntry[];
	/** Final total score per player, keyed by `GameHistoryPlayerEntry.playerId`. */
	finalScores: Record<string, number>;
};

export type GameHistoryState = {
	entries: GameHistoryEntry[];
};

// ─── Storage access ───────────────────────────────────────────────────────────

const HISTORY_KEY = 'score-tracker-history.json';

/**
 * Persist the game history to disk.
 */
export async function saveGameHistory(entries: GameHistoryEntry[]): Promise<void> {
	try {
		await setStorageItem(HISTORY_KEY, JSON.stringify({ entries }));
	} catch (err) {
		console.warn('[GameHistoryStorage] Failed to save game history:', err);
	}
}

/**
 * Load the persisted game history from disk.
 */
export async function loadGameHistory(): Promise<GameHistoryEntry[]> {
	try {
		const raw = await getStorageItem(HISTORY_KEY);
		if (raw === null) return [];
		const parsed = JSON.parse(raw) as Partial<GameHistoryState>;
		if (Array.isArray(parsed.entries)) return parsed.entries;
		return [];
	} catch {
		return [];
	}
}
