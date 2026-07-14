import { File, Paths } from 'expo-file-system';
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

// ─── File access ──────────────────────────────────────────────────────────────

function getHistoryFile(): File {
	return new File(Paths.document, 'score-tracker-history.json');
}

/**
 * Persist the game history to disk.
 */
export function saveGameHistory(entries: GameHistoryEntry[]): void {
	try {
		getHistoryFile().write(JSON.stringify({ entries }));
	} catch (err) {
		console.warn('[GameHistoryStorage] Failed to save game history:', err);
	}
}

/**
 * Load the persisted game history from disk.
 */
export async function loadGameHistory(): Promise<GameHistoryEntry[]> {
	try {
		const file = getHistoryFile();
		if (!file.exists) return [];
		const content = await file.text();
		const parsed = JSON.parse(content) as Partial<GameHistoryState>;
		if (Array.isArray(parsed.entries)) return parsed.entries;
		return [];
	} catch {
		return [];
	}
}
