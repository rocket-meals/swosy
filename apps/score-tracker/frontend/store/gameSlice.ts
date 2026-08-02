import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AvatarConfig } from 'repo-depkit-common-ui';
import type { Player, Round, GameState, GameStatus } from '../helpers/GameStorage';
import { PLAYER_COLORS } from '../helpers/GameStorage';
import type { Friend } from '../helpers/FriendsStorage';
import type { GameHistoryEntry } from '../helpers/GameHistoryStorage';
import type { GameCategoryValue } from '../helpers/GameCategories';
import { renameFriend, setFriendColor, setFriendAvatar } from './friendsSlice';
import { removeGameType } from './gameTypesSlice';
import { generateId } from '../helpers/RandomHelper';
export type { Player, Round, GameState, GameStatus } from '../helpers/GameStorage';

// ─── State type ───────────────────────────────────────────────────────────────

/** Redux slice state for the current match; identical shape to the persisted `GameState`. */
export type GameSliceState = GameState;

const initialState: GameSliceState = {
	players: [],
	rounds: [],
	status: 'setup',
	currentRoundIndex: 0,
	matchId: undefined,
	gameTypeId: undefined,
	playerOrderState: undefined,
	startedAt: undefined,
	endedAt: undefined,
	durationMinutes: undefined,
	categoryValues: {},
	playerCategoryValues: {},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
				matchId: action.payload.matchId,
				gameTypeId: action.payload.gameTypeId,
				playerOrderState: action.payload.playerOrderState,
				startedAt: action.payload.startedAt,
				endedAt: action.payload.endedAt,
				durationMinutes: action.payload.durationMinutes,
				categoryValues: action.payload.categoryValues ?? {},
				playerCategoryValues: action.payload.playerCategoryValues ?? {},
			};
		},

		/** Add a new guest player (not linked to any friend) with a default name. `atStart` seats them first instead of last. */
		addGuestPlayer(state, action: PayloadAction<{ atStart?: boolean } | undefined>) {
			const playerNumber = state.players.length + 1;
			const color = PLAYER_COLORS[state.players.length % PLAYER_COLORS.length];
			const newPlayer: Player = { id: generateId(), name: `Spieler ${playerNumber}`, color };
			if (action.payload?.atStart) {
				state.players.unshift(newPlayer);
			} else {
				state.players.push(newPlayer);
			}
			for (const round of state.rounds) {
				round.scores[newPlayer.id] = null;
			}
		},

		/** Add a player snapshotted from an existing friend (name/color/avatar copied at add-time). `atStart` seats them first instead of last. */
		addFriendPlayer(state, action: PayloadAction<{ friend: Friend; atStart?: boolean }>) {
			const { friend, atStart } = action.payload;
			const newPlayer: Player = {
				id: generateId(),
				name: friend.name,
				color: friend.color,
				avatarConfig: friend.avatarConfig,
				friendId: friend.id,
			};
			if (atStart) {
				state.players.unshift(newPlayer);
			} else {
				state.players.push(newPlayer);
			}
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

		/**
		 * Link an existing (guest) player to a friend, e.g. right after the guest
		 * was saved to the friends roster via "Als Freund speichern".
		 */
		linkPlayerToFriend(state, action: PayloadAction<{ playerId: string; friendId: string }>) {
			const player = state.players.find((p) => p.id === action.payload.playerId);
			if (player) {
				player.friendId = action.payload.friendId;
			}
		},

		/**
		 * Select (or clear) the game type the current match is played as.
		 * Category values are keyed by the *previous* game type's category ids,
		 * so switching games drops them instead of carrying meaningless
		 * leftovers into the new one.
		 */
		setGameType(state, action: PayloadAction<string | undefined>) {
			if (state.gameTypeId !== action.payload) {
				state.categoryValues = {};
				state.playerCategoryValues = {};
			}
			state.gameTypeId = action.payload;
		},

		/** Record a match-scope category value (see helpers/GameCategories). */
		setCategoryValue(state, action: PayloadAction<{ categoryId: string; value: GameCategoryValue }>) {
			if (!state.categoryValues) state.categoryValues = {};
			state.categoryValues[action.payload.categoryId] = action.payload.value;
		},

		/** Record a player-scope category value for one player. */
		setPlayerCategoryValue(
			state,
			action: PayloadAction<{ playerId: string; categoryId: string; value: GameCategoryValue }>,
		) {
			if (!state.playerCategoryValues) state.playerCategoryValues = {};
			const forPlayer = state.playerCategoryValues[action.payload.playerId] ?? {};
			forPlayer[action.payload.categoryId] = action.payload.value;
			state.playerCategoryValues[action.payload.playerId] = forPlayer;
		},

		/** Move a player one seat up/down in the table order (manual seating adjustment). No-op at either edge. */
		movePlayer(state, action: PayloadAction<{ playerId: string; direction: 'up' | 'down' }>) {
			const { playerId, direction } = action.payload;
			const index = state.players.findIndex((p) => p.id === playerId);
			if (index === -1) return;
			const targetIndex = direction === 'up' ? index - 1 : index + 1;
			if (targetIndex < 0 || targetIndex >= state.players.length) return;
			const [player] = state.players.splice(index, 1);
			state.players.splice(targetIndex, 0, player);
		},

		/** Remove a player and their scores from all rounds. */
		removePlayer(state, action: PayloadAction<string>) {
			state.players = state.players.filter((p) => p.id !== action.payload);
			for (const round of state.rounds) {
				delete round.scores[action.payload];
				if (round.cardSelections) delete round.cardSelections[action.payload];
			}
			if (state.playerCategoryValues) delete state.playerCategoryValues[action.payload];
		},

		/** Set the score for a player in a specific round. */
		setScore(state, action: PayloadAction<{ roundId: string; playerId: string; score: number | null }>) {
			const round = state.rounds.find((r) => r.id === action.payload.roundId);
			if (round) {
				round.scores[action.payload.playerId] = action.payload.score;
			}
		},

		/**
		 * Set a player's card selection for a round (card-based score entry, see
		 * GameRules) together with the score already computed from it via the
		 * game type's rule formula.
		 */
		setCardSelection(
			state,
			action: PayloadAction<{ roundId: string; playerId: string; cardIds: string[]; score: number }>,
		) {
			const round = state.rounds.find((r) => r.id === action.payload.roundId);
			if (!round) return;
			round.scores[action.payload.playerId] = action.payload.score;
			if (!round.cardSelections) round.cardSelections = {};
			round.cardSelections[action.payload.playerId] = action.payload.cardIds;
		},

		/**
		 * Correct the automatically stamped start time of the running match by
		 * hand (see helpers/MatchTimes). `null` clears it - such a match simply
		 * has no recorded start and thus no duration.
		 */
		setStartedAt(state, action: PayloadAction<number | null>) {
			state.startedAt = action.payload ?? undefined;
		},

		/**
		 * Leave the setup phase and start the match. Round 1 always starts with
		 * the first seat.
		 *
		 * A game that doesn't score its players (`trackScores: false`, see
		 * GameRules) has no rounds at all - everything it records lives in its
		 * categories - so the caller passes `withRounds: false` and no round is
		 * created.
		 */
		startGame(state, action: PayloadAction<{ withRounds?: boolean } | undefined>) {
			if (state.status !== 'setup') return;
			const withRounds = action.payload?.withRounds ?? true;
			state.status = 'active';
			state.rounds = withRounds
				? [{ id: generateId(), scores: emptyScoresFor(state.players), startingPlayerId: state.players[0]?.id }]
				: [];
			state.currentRoundIndex = 0;
			state.matchId = generateId();
			state.playerOrderState = undefined;
			// Built-in start tracking (see helpers/MatchTimes): pressing "Spiel
			// starten" stamps the start; the end is stamped when the match is
			// ended and the duration derived from the two.
			state.startedAt = Date.now();
			state.endedAt = undefined;
			state.durationMinutes = undefined;
		},

		/**
		 * Open an archived match (see the game detail screen's match list) for
		 * viewing: its players, rounds and recorded category values become the
		 * currently loaded match, but in the read-only `finished` state - nothing
		 * about the archived entry can be changed until it is explicitly
		 * re-opened for play via `reopenMatch`. It keeps its id, so archiving
		 * after re-opening updates that same history entry.
		 *
		 * The rounds and category values are deep-copied: the history entry and
		 * the live match state must never share objects, or editing the loaded
		 * match could silently rewrite the archive.
		 *
		 * Entries archived before rounds were kept fall back to a single round
		 * holding the final scores - the per-round breakdown is gone for those,
		 * but their totals stay visible.
		 */
		loadMatch(state, action: PayloadAction<GameHistoryEntry>) {
			const entry = action.payload;
			const players: Player[] = entry.players.map((player, index) => ({
				id: player.playerId,
				name: player.name,
				color: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length],
				avatarConfig: player.avatarConfig,
				friendId: player.friendId,
			}));
			let rounds: Round[] = [];
			if (entry.rounds) {
				rounds = entry.rounds.map((round) => ({
					id: round.id,
					scores: { ...round.scores },
					cardSelections: round.cardSelections
						? Object.fromEntries(Object.entries(round.cardSelections).map(([playerId, cards]) => [playerId, [...cards]]))
						: undefined,
					startingPlayerId: round.startingPlayerId,
				}));
			} else if (Object.keys(entry.finalScores).length > 0) {
				rounds = [{ id: generateId(), scores: { ...entry.finalScores } }];
			}
			const playerCategoryValues = Object.fromEntries(
				Object.entries(entry.playerCategoryValues ?? {}).map(([playerId, values]) => [playerId, { ...values }]),
			);
			return {
				players,
				rounds,
				status: 'finished' as const,
				currentRoundIndex: Math.max(0, rounds.length - 1),
				matchId: entry.id,
				gameTypeId: entry.gameTypeId,
				playerOrderState: undefined,
				startedAt: entry.startedAt,
				endedAt: entry.endedAt,
				durationMinutes: entry.durationMinutes,
				categoryValues: { ...(entry.categoryValues ?? {}) },
				playerCategoryValues,
			};
		},

		/**
		 * Put a `finished` (view-only) match back into play. Only reachable from
		 * the match options modal ("Partie wieder öffnen") - the counterpart of
		 * "Partie beenden" there. From then on the match behaves like any running
		 * one; ending it again updates its existing history entry.
		 */
		reopenMatch(state) {
			if (state.status !== 'finished') return;
			state.status = 'active';
			// The start stays - re-ending the match stamps a fresh end and
			// recomputes the duration from the original start.
			state.endedAt = undefined;
			state.durationMinutes = undefined;
		},

		/** Move to the previous round (view/edit its scores). No-op at round 1. */
		goToPreviousRound(state) {
			state.currentRoundIndex = Math.max(0, state.currentRoundIndex - 1);
		},

		/**
		 * Move to the next round, creating it first if it doesn't exist yet. When
		 * creating a new round, the caller (which alone knows the selected game
		 * type's `startingPlayerMode`) supplies who starts it and the resulting
		 * custom-rule state - see `computeNextStartingPlayerIndex` in GameRules.
		 */
		goToNextRound(state, action: PayloadAction<{ startingPlayerId?: string; nextOrderState?: number } | undefined>) {
			// A finished (view-only) match pages through its recorded rounds but
			// never grows by a new one - it has to be re-opened first.
			if (state.status === 'finished') {
				state.currentRoundIndex = Math.min(state.rounds.length - 1, state.currentRoundIndex + 1);
				return;
			}
			if (state.currentRoundIndex >= state.rounds.length - 1) {
				state.rounds.push({
					id: generateId(),
					scores: emptyScoresFor(state.players),
					startingPlayerId: action.payload?.startingPlayerId,
				});
				state.playerOrderState = action.payload?.nextOrderState;
			}
			state.currentRoundIndex = Math.min(state.rounds.length - 1, state.currentRoundIndex + 1);
		},

		/**
		 * Clear all rounds and recorded category values, back to setup. Players
		 * are kept by default ("Alle Punkte zurücksetzen" restarts the same
		 * group); `clearPlayers: true` empties the seats too - a brand-new match
		 * ("Neue Partie starten") begins with nobody, and the players are picked
		 * in the setup phase instead of inheriting the previous match's roster.
		 */
		resetScores(state, action: PayloadAction<{ clearPlayers?: boolean } | undefined>) {
			if (action.payload?.clearPlayers) state.players = [];
			state.rounds = [];
			state.status = 'setup';
			state.currentRoundIndex = 0;
			state.matchId = undefined;
			state.playerOrderState = undefined;
			state.startedAt = undefined;
			state.endedAt = undefined;
			state.durationMinutes = undefined;
			state.categoryValues = {};
			state.playerCategoryValues = {};
		},

		/** Delete everything (players and rounds) and return to the setup phase. */
		resetAll() {
			return {
				players: [],
				rounds: [],
				status: 'setup' as const,
				currentRoundIndex: 0,
				matchId: undefined,
				gameTypeId: undefined,
				startedAt: undefined,
				endedAt: undefined,
				durationMinutes: undefined,
				categoryValues: {},
				playerCategoryValues: {},
			};
		},
	},
	// Players added from a friend are linked via friendId. When the friend is
	// edited in the players screen, mirror the change onto the linked player(s)
	// of the current game so both screens stay in sync.
	extraReducers: (builder) => {
		builder
			.addCase(renameFriend, (state, action) => {
				for (const player of state.players) {
					if (player.friendId === action.payload.friendId) {
						player.name = action.payload.name;
					}
				}
			})
			.addCase(setFriendColor, (state, action) => {
				for (const player of state.players) {
					if (player.friendId === action.payload.friendId) {
						player.color = action.payload.color;
					}
				}
			})
			.addCase(setFriendAvatar, (state, action) => {
				for (const player of state.players) {
					if (player.friendId === action.payload.friendId) {
						player.avatarConfig = action.payload.avatarConfig;
					}
				}
			})
			// A deleted game type must not leave a dangling reference on the
			// current match - fall back to "no specific game".
			.addCase(removeGameType, (state, action) => {
				if (state.gameTypeId === action.payload) {
					state.gameTypeId = undefined;
					state.categoryValues = {};
					state.playerCategoryValues = {};
				}
			});
	},
});

export const {
	loadGameState,
	addGuestPlayer,
	addFriendPlayer,
	renamePlayer,
	setPlayerColor,
	setPlayerAvatar,
	linkPlayerToFriend,
	setGameType,
	loadMatch,
	reopenMatch,
	setStartedAt,
	setCategoryValue,
	setPlayerCategoryValue,
	movePlayer,
	removePlayer,
	setScore,
	setCardSelection,
	startGame,
	goToPreviousRound,
	goToNextRound,
	resetScores,
	resetAll,
} = gameSlice.actions;
export default gameSlice.reducer;
