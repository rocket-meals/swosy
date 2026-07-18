import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Whether the highest or the lowest total score wins a match of this game. */
export type ScoringMode = 'highWins' | 'lowWins';

export type GameType = {
	id: string;
	name: string;
	/** Emoji shown as the game's "image" in lists and headers (e.g. 🎲). */
	icon: string;
	scoringMode: ScoringMode;
	/** Maximum number of rounds per match. undefined/null = unlimited. */
	maxRounds?: number | null;
	/** Total score at which a match ends. undefined/null = unlimited. */
	maxScore?: number | null;
	createdAt: number;
};

/** Curated emoji choices for the game icon picker. */
export const GAME_TYPE_ICONS = [
	'🎲', '🃏', '🀄', '♟️', '🎯', '🎳', '🏓', '🎱',
	'🧩', '🎮', '🐍', '🏰', '🚂', '🌋', '🦄', '🐫',
	'⚽', '🏆', '💰', '💎', '🗺️', '🚀', '👻', '🧙',
] as const;

export const DEFAULT_GAME_TYPE_ICON = '🎲';

// ─── Storage access ───────────────────────────────────────────────────────────

const GAME_TYPES_KEY = 'score-tracker-game-types.json';

export type GameTypesState = {
	gameTypes: GameType[];
};

/**
 * Persist the game types (kinds of games, e.g. "Skat", "Phase 10") to disk.
 */
export async function saveGameTypes(gameTypes: GameType[]): Promise<void> {
	try {
		await setStorageItem(GAME_TYPES_KEY, JSON.stringify({ gameTypes }));
	} catch (err) {
		console.warn('[GameTypesStorage] Failed to save game types:', err);
	}
}

/**
 * Load the persisted game types from disk.
 */
export async function loadGameTypes(): Promise<GameType[]> {
	try {
		const raw = await getStorageItem(GAME_TYPES_KEY);
		if (raw === null) return [];
		const parsed = JSON.parse(raw) as Partial<GameTypesState>;
		if (Array.isArray(parsed.gameTypes)) return parsed.gameTypes;
		return [];
	} catch {
		return [];
	}
}
