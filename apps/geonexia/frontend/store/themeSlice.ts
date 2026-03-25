import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ThemeMode } from '../helpers/ThemeStorage';
export type { ThemeMode };

// ─── State type ───────────────────────────────────────────────────────────────

export type ThemeSliceState = {
	selectedMode: ThemeMode;
};

const initialState: ThemeSliceState = {
	selectedMode: 'systematic',
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const themeSlice = createSlice({
	name: 'theme',
	initialState,
	reducers: {
		/**
		 * Set the active theme mode. Persisted to disk by the store subscriber.
		 */
		setThemeMode(state, action: PayloadAction<ThemeMode>) {
			state.selectedMode = action.payload;
		},

		/**
		 * Load the persisted theme mode from disk. Called once at app startup.
		 */
		loadThemeMode(state, action: PayloadAction<ThemeMode>) {
			state.selectedMode = action.payload;
		},
	},
});

export const { setThemeMode, loadThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
