import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GameType, ScoringMode } from '../helpers/GameTypesStorage';
import { DEFAULT_GAME_TYPE_ICON } from '../helpers/GameTypesStorage';
export type { GameType, ScoringMode };

// ─── State type ───────────────────────────────────────────────────────────────

export type GameTypesSliceState = {
	gameTypes: GameType[];
};

const initialState: GameTypesSliceState = {
	gameTypes: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const gameTypesSlice = createSlice({
	name: 'gameTypes',
	initialState,
	reducers: {
		/** Load persisted game types from disk. Called once at startup. */
		loadGameTypes(state, action: PayloadAction<GameType[]>) {
			state.gameTypes = action.payload;
		},

		/** Create a new game type with a default icon and "high score wins" scoring. */
		addGameType: {
			reducer(state, action: PayloadAction<GameType>) {
				state.gameTypes.push(action.payload);
			},
			prepare(name: string) {
				const gameType: GameType = {
					id: generateId(),
					name,
					icon: DEFAULT_GAME_TYPE_ICON,
					scoringMode: 'highWins',
					maxRounds: null,
					maxScore: null,
					createdAt: Date.now(),
				};
				return { payload: gameType };
			},
		},

		renameGameType(state, action: PayloadAction<{ gameTypeId: string; name: string }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.name = action.payload.name;
		},

		setGameTypeIcon(state, action: PayloadAction<{ gameTypeId: string; icon: string }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.icon = action.payload.icon;
		},

		setGameTypeScoringMode(state, action: PayloadAction<{ gameTypeId: string; scoringMode: ScoringMode }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.scoringMode = action.payload.scoringMode;
		},

		setGameTypeMaxRounds(state, action: PayloadAction<{ gameTypeId: string; maxRounds: number | null }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.maxRounds = action.payload.maxRounds;
		},

		setGameTypeMaxScore(state, action: PayloadAction<{ gameTypeId: string; maxScore: number | null }>) {
			const gameType = state.gameTypes.find((g) => g.id === action.payload.gameTypeId);
			if (gameType) gameType.maxScore = action.payload.maxScore;
		},

		removeGameType(state, action: PayloadAction<string>) {
			state.gameTypes = state.gameTypes.filter((g) => g.id !== action.payload);
		},
	},
});

export const {
	loadGameTypes,
	addGameType,
	renameGameType,
	setGameTypeIcon,
	setGameTypeScoringMode,
	setGameTypeMaxRounds,
	setGameTypeMaxScore,
	removeGameType,
} = gameTypesSlice.actions;
export default gameTypesSlice.reducer;
