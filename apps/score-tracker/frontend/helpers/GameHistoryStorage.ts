import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import type { PlayerIdentity } from './PlayerIdentity';
import type { GameCategoryValues } from './GameCategories';
import type { GameState, Round } from './GameStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GameHistoryPlayerEntry = PlayerIdentity & {
	/** The archived game's transient `Player.id` - the key into `finalScores`. */
	playerId: string;
	/** Present when this participant was a friend at the time the game was archived. */
	friendId?: string;
};

export type GameHistoryEntry = {
	id: string;
	endedAt: number;
	roundsCount: number;
	players: GameHistoryPlayerEntry[];
	/** Final total score per player, keyed by `GameHistoryPlayerEntry.playerId`. */
	finalScores: Record<string, number>;
	/** Present when the match was played as a specific game (see GameTypesStorage). */
	gameTypeId?: string;
	/** Recorded match-scope category values (see GameCategories), keyed by category id. */
	categoryValues?: GameCategoryValues;
	/** Recorded player-scope category values, keyed by `GameHistoryPlayerEntry.playerId` and then category id. */
	playerCategoryValues?: Record<string, GameCategoryValues>;
	/**
	 * The match's rounds, kept so an archived match can be re-opened and played
	 * on (see `loadMatch` in the game slice). Absent on entries archived before
	 * re-opening existed - those only carry `finalScores`.
	 */
	rounds?: Round[];
};

export type GameHistoryState = {
	entries: GameHistoryEntry[];
};

// ─── Building an entry from a played match ────────────────────────────────────

/**
 * Whether anything was actually recorded in this match: a round score, a card
 * selection, or a category value. A match without any of these (e.g. the empty
 * follow-up match opened right after ending one) is not worth archiving - the
 * callers skip saving it instead of cluttering the history with blanks.
 */
export function hasRecordedResults(game: GameState): boolean {
	const anyRoundEntry = game.rounds.some(
		(round) =>
			Object.values(round.scores).some((score) => score != null) ||
			(round.cardSelections != null && Object.values(round.cardSelections).some((cards) => cards.length > 0)),
	);
	if (anyRoundEntry) return true;
	if (game.categoryValues && Object.keys(game.categoryValues).length > 0) return true;
	return (
		game.playerCategoryValues != null &&
		Object.values(game.playerCategoryValues).some((values) => Object.keys(values).length > 0)
	);
}

/**
 * Snapshot of the currently played match, ready to be archived. Keeps the
 * match's own id (`GameState.matchId`), so archiving the same match twice -
 * e.g. after re-opening and playing on - updates its entry instead of adding a
 * duplicate one (see `archiveGame`).
 */
export function buildHistoryEntry(game: GameState, params: { id: string; endedAt: number }): GameHistoryEntry {
	const finalScores: Record<string, number> = {};
	for (const player of game.players) {
		let total = 0;
		for (const round of game.rounds) {
			const score = round.scores[player.id];
			if (score != null) total += score;
		}
		finalScores[player.id] = total;
	}

	return {
		id: params.id,
		endedAt: params.endedAt,
		roundsCount: game.rounds.length,
		players: game.players.map((player) => ({
			playerId: player.id,
			friendId: player.friendId,
			name: player.name,
			color: player.color,
			avatarConfig: player.avatarConfig,
		})),
		finalScores,
		gameTypeId: game.gameTypeId,
		categoryValues: game.categoryValues,
		playerCategoryValues: game.playerCategoryValues,
		rounds: game.rounds,
	};
}

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
