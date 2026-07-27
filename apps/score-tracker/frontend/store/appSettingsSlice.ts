import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ColumnsCount, GamesSortMode } from '../helpers/AppSettingsStorage';
export type { ColumnsCount, GamesSortMode };

// ─── State type ───────────────────────────────────────────────────────────────

export type AppSettingsSliceState = {
	columnsPortrait: ColumnsCount;
	columnsLandscape: ColumnsCount;
	gamesSortMode: GamesSortMode;
};

const initialState: AppSettingsSliceState = {
	columnsPortrait: 1,
	columnsLandscape: 2,
	gamesSortMode: 'lastPlayed',
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const appSettingsSlice = createSlice({
	name: 'appSettings',
	initialState,
	reducers: {
		/** Load persisted app settings from disk. Called once at startup. */
		loadAppSettings(state, action: PayloadAction<AppSettingsSliceState>) {
			state.columnsPortrait = action.payload.columnsPortrait;
			state.columnsLandscape = action.payload.columnsLandscape;
			state.gamesSortMode = action.payload.gamesSortMode;
		},

		setColumnsPortrait(state, action: PayloadAction<ColumnsCount>) {
			state.columnsPortrait = action.payload;
		},

		setColumnsLandscape(state, action: PayloadAction<ColumnsCount>) {
			state.columnsLandscape = action.payload;
		},

		setGamesSortMode(state, action: PayloadAction<GamesSortMode>) {
			state.gamesSortMode = action.payload;
		},
	},
});

export const { loadAppSettings, setColumnsPortrait, setColumnsLandscape, setGamesSortMode } = appSettingsSlice.actions;
export default appSettingsSlice.reducer;
