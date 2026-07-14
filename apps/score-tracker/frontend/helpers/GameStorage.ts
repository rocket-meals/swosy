import { File, Paths } from 'expo-file-system';
import type { AvatarConfig } from 'repo-depkit-common-ui';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Player = {
	id: string;
	name: string;
	color: string;
	/** Snapshot avatar, taken at the time the player was added to this game. */
	avatarConfig?: AvatarConfig;
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
};

export type GameStatus = 'setup' | 'active';

export type GameState = {
	players: Player[];
	rounds: Round[];
	status: GameStatus;
	currentRoundIndex: number;
};

// ─── File access ──────────────────────────────────────────────────────────────

function getGameFile(): File {
	return new File(Paths.document, 'score-tracker-game.json');
}

/**
 * Persist game state to disk.
 */
export function saveGameState(state: GameState): void {
	try {
		getGameFile().write(JSON.stringify(state));
	} catch (err) {
		console.warn('[GameStorage] Failed to save game state:', err);
	}
}

function emptyGameState(): GameState {
	return { players: [], rounds: [], status: 'setup', currentRoundIndex: 0 };
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
		const file = getGameFile();
		if (!file.exists) return emptyGameState();
		const content = await file.text();
		const parsed = JSON.parse(content) as Partial<GameState>;
		if (Array.isArray(parsed.players) && Array.isArray(parsed.rounds)) {
			const rounds = parsed.rounds;
			const status: GameStatus = parsed.status ?? (rounds.length > 0 ? 'active' : 'setup');
			const currentRoundIndex = parsed.currentRoundIndex ?? Math.max(0, rounds.length - 1);
			return { players: parsed.players, rounds, status, currentRoundIndex };
		}
		return emptyGameState();
	} catch {
		return emptyGameState();
	}
}
