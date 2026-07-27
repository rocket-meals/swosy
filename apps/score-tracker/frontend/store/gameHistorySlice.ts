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

		/**
		 * Archive a played match (called before clearing or replacing the active
		 * match). Upsert by id: a match that was re-opened from the history and
		 * played on keeps its entry instead of being archived a second time.
		 */
		archiveGame(state, action: PayloadAction<GameHistoryEntry>) {
			const index = state.entries.findIndex((entry) => entry.id === action.payload.id);
			if (index === -1) {
				state.entries.push(action.payload);
			} else {
				state.entries[index] = action.payload;
			}
		},

		/** Delete a single archived match. */
		removeGameFromHistory(state, action: PayloadAction<string>) {
			state.entries = state.entries.filter((entry) => entry.id !== action.payload);
		},
	},
});

export const { loadGameHistory, archiveGame, removeGameFromHistory } = gameHistorySlice.actions;
export default gameHistorySlice.reducer;
