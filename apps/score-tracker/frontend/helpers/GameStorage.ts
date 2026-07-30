import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import type { PlayerIdentity } from './PlayerIdentity';
import type { GameCategoryValues } from './GameCategories';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Player = PlayerIdentity & {
	id: string;
	/** Set when this player was added from the friends roster. Absent = guest player. */
	friendId?: string;
};

export const PLAYER_COLORS = [
	'#2563eb', // blue
	'#dc2626', // red
	'#16a34a', // green
	'#ea580c', // orange
	'#9333ea', // purple
	'#0891b2', // cyan
	'#ca8a04', // yellow
	'#db2777', // pink
];

export type Round = {
	id: string;
	scores: Record<string, number | null>; // playerId → score (null = not entered)
	/**
	 * playerId → ids of the cards selected for that player this round, for
	 * game types with custom card-based score entry (see GameRules). The
	 * score itself still lives in `scores` (pre-computed from this selection
	 * via the game type's rule formula) so all existing totals/leaderboard
	 * logic keeps working unchanged; this is only kept so the card picker can
	 * be re-opened and edited later.
	 */
	cardSelections?: Record<string, string[]>;
	/** Player id of whoever starts this round, per the game type's `startingPlayerMode`. */
	startingPlayerId?: string;
};

/**
 * Lifecycle of the currently loaded match. `finished` is an archived match
 * re-opened from its game's Partien list purely to look at it: everything is
 * read-only until it is explicitly re-opened for play via the match options
 * ("Partie wieder öffnen") - the same modal a running match is ended in.
 */
export type GameStatus = 'setup' | 'active' | 'finished';

export type GameState = {
	players: Player[];
	rounds: Round[];
	status: GameStatus;
	currentRoundIndex: number;
	/**
	 * Stable id of the match being played, generated when it starts. Archiving
	 * reuses it (see `buildHistoryEntry`), so a match re-opened from the history
	 * and played on updates its own entry instead of piling up copies.
	 */
	matchId?: string;
	/** Set when the current match is played as a specific game (see GameTypesStorage). */
	gameTypeId?: string;
	/** Numeric state carried between rounds for a `startingPlayerMode: 'custom'` rule (see GameRules). */
	playerOrderState?: number;
	/** When the match ended - only set while `status` is `finished` (viewing an archived match). */
	endedAt?: number;
	/** Values of the game type's match-scope categories (see GameCategories), keyed by category id. */
	categoryValues?: GameCategoryValues;
	/** Values of the game type's player-scope categories, keyed by player id and then category id. */
	playerCategoryValues?: Record<string, GameCategoryValues>;
};

// ─── Storage access ───────────────────────────────────────────────────────────

const GAME_KEY = 'score-tracker-game.json';

/**
 * Persist game state to disk.
 */
export async function saveGameState(state: GameState): Promise<void> {
	try {
		await setStorageItem(GAME_KEY, JSON.stringify(state));
	} catch (err) {
		console.warn('[GameStorage] Failed to save game state:', err);
	}
}

function emptyGameState(): GameState {
	return { players: [], rounds: [], status: 'setup', currentRoundIndex: 0, categoryValues: {}, playerCategoryValues: {} };
}

/**
 * Load persisted game state from disk.
 *
 * Falls back defaults for `status`/`currentRoundIndex` so files saved before
 * those fields existed keep loading correctly (existing rounds imply an
 * already-started game).
 */
export async function loadGameState(): Promise<GameState> {
	try {
		const raw = await getStorageItem(GAME_KEY);
		if (raw === null) return emptyGameState();
		const parsed = JSON.parse(raw) as Partial<GameState>;
		if (Array.isArray(parsed.players) && Array.isArray(parsed.rounds)) {
			const rounds = parsed.rounds;
			const status: GameStatus = parsed.status ?? (rounds.length > 0 ? 'active' : 'setup');
			const currentRoundIndex = parsed.currentRoundIndex ?? Math.max(0, rounds.length - 1);
			return {
				players: parsed.players,
				rounds,
				status,
				currentRoundIndex,
				matchId: parsed.matchId,
				gameTypeId: parsed.gameTypeId,
				playerOrderState: parsed.playerOrderState,
				endedAt: parsed.endedAt,
				categoryValues: parsed.categoryValues ?? {},
				playerCategoryValues: parsed.playerCategoryValues ?? {},
			};
		}
		return emptyGameState();
	} catch {
		return emptyGameState();
	}
}
