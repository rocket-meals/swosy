import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GameHistoryEntry } from '../helpers/GameHistoryStorage';
export type { GameHistoryEntry };

// ─── State type ───────────────────────────────────────────────────────────────

export type GameHistorySliceState = {
	entries: GameHistoryEntry[];
};

const initialState: GameHistorySliceState = {
	entries: [],
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const gameHistorySlice = createSlice({
	name: 'gameHistory',
	initialState,
	reducers: {
		/** Load persisted game history from disk. Called once at startup. */
		loadGameHistory(state, action: PayloadAction<GameHistoryEntry[]>) {
			state.entries = action.payload;
		},

		/** Archive a finished game (called before clearing the active game). */
		archiveGame(state, action: PayloadAction<GameHistoryEntry>) {
			state.entries.push(action.payload);
		},
	},
});

export const { loadGameHistory, archiveGame } = gameHistorySlice.actions;
export default gameHistorySlice.reducer;
