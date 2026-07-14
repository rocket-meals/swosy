import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AvatarConfig } from 'repo-depkit-common-ui';
import type { Player, Round, GameState, GameStatus } from '../helpers/GameStorage';
import { PLAYER_COLORS } from '../helpers/GameStorage';
import type { Friend } from '../helpers/FriendsStorage';
export type { Player, Round, GameState, GameStatus };

// ─── State type ───────────────────────────────────────────────────────────────

export type GameSliceState = {
	players: Player[];
	rounds: Round[];
	status: GameStatus;
	currentRoundIndex: number;
};

const initialState: GameSliceState = {
	players: [],
	rounds: [],
	status: 'setup',
	currentRoundIndex: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function emptyScoresFor(players: Player[]): Record<string, number | null> {
	const scores: Record<string, number | null> = {};
	for (const player of players) {
		scores[player.id] = null;
	}
	return scores;
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const gameSlice = createSlice({
	name: 'game',
	initialState,
	reducers: {
		/** Load persisted game state from disk. Called once at startup. */
		loadGameState(_state, action: PayloadAction<GameState>) {
			const players = action.payload.players.map((p, i) => ({
				...p,
				color: p.color || PLAYER_COLORS[i % PLAYER_COLORS.length],
			}));
			return {
				players,
				rounds: action.payload.rounds,
				status: action.payload.status,
				currentRoundIndex: action.payload.currentRoundIndex,
			};
		},

		/** Add a new guest player (not linked to any friend) with a default name. */
		addGuestPlayer(state) {
			const playerNumber = state.players.length + 1;
			const color = PLAYER_COLORS[state.players.length % PLAYER_COLORS.length];
			const newPlayer: Player = { id: generateId(), name: `Spieler ${playerNumber}`, color };
			state.players.push(newPlayer);
			for (const round of state.rounds) {
				round.scores[newPlayer.id] = null;
			}
		},

		/** Add a player snapshotted from an existing friend (name/color/avatar copied at add-time). */
		addFriendPlayer(state, action: PayloadAction<Friend>) {
			const friend = action.payload;
			const newPlayer: Player = {
				id: generateId(),
				name: friend.name,
				color: friend.color,
				avatarConfig: friend.avatarConfig,
				friendId: friend.id,
			};
			state.players.push(newPlayer);
			for (const round of state.rounds) {
				round.scores[newPlayer.id] = null;
			}
		},

		/** Rename a player. */
		renamePlayer(state, action: PayloadAction<{ playerId: string; name: string }>) {
			const player = state.players.find((p) => p.id === action.payload.playerId);
			if (player) {
				player.name = action.payload.name;
			}
		},

		/** Change a player's tile color. */
		setPlayerColor(state, action: PayloadAction<{ playerId: string; color: string }>) {
			const player = state.players.find((p) => p.id === action.payload.playerId);
			if (player) {
				player.color = action.payload.color;
			}
		},

		/** Change a player's avatar. */
		setPlayerAvatar(state, action: PayloadAction<{ playerId: string; avatarConfig: AvatarConfig }>) {
			const player = state.players.find((p) => p.id === action.payload.playerId);
			if (player) {
				player.avatarConfig = action.payload.avatarConfig;
			}
		},

		/** Remove a player and their scores from all rounds. */
		removePlayer(state, action: PayloadAction<string>) {
			state.players = state.players.filter((p) => p.id !== action.payload);
			for (const round of state.rounds) {
				delete round.scores[action.payload];
			}
		},

		/** Set the score for a player in a specific round. */
		setScore(state, action: PayloadAction<{ roundId: string; playerId: string; score: number | null }>) {
			const round = state.rounds.find((r) => r.id === action.payload.roundId);
			if (round) {
				round.scores[action.payload.playerId] = action.payload.score;
			}
		},

		/** Leave the setup phase (round 0) and start round 1. */
		startGame(state) {
			if (state.status === 'active') return;
			state.status = 'active';
			state.rounds = [{ id: generateId(), scores: emptyScoresFor(state.players) }];
			state.currentRoundIndex = 0;
		},

		/** Move to the previous round (view/edit its scores). No-op at round 1. */
		goToPreviousRound(state) {
			state.currentRoundIndex = Math.max(0, state.currentRoundIndex - 1);
		},

		/** Move to the next round, creating it first if it doesn't exist yet. */
		goToNextRound(state) {
			if (state.currentRoundIndex >= state.rounds.length - 1) {
				state.rounds.push({ id: generateId(), scores: emptyScoresFor(state.players) });
			}
			state.currentRoundIndex = Math.min(state.rounds.length - 1, state.currentRoundIndex + 1);
		},

		/** Clear all rounds and return to the setup phase (keeps players). */
		resetScores(state) {
			state.rounds = [];
			state.status = 'setup';
			state.currentRoundIndex = 0;
		},

		/** Delete everything (players and rounds) and return to the setup phase. */
		resetAll() {
			return { players: [], rounds: [], status: 'setup', currentRoundIndex: 0 };
		},
	},
});

export const {
	loadGameState,
	addGuestPlayer,
	addFriendPlayer,
	renamePlayer,
	setPlayerColor,
	setPlayerAvatar,
	removePlayer,
	setScore,
	startGame,
	goToPreviousRound,
	goToNextRound,
	resetScores,
	resetAll,
} = gameSlice.actions;
export default gameSlice.reducer;
