import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ColumnsCount } from '../helpers/AppSettingsStorage';
export type { ColumnsCount };

// ─── State type ───────────────────────────────────────────────────────────────

export type AppSettingsSliceState = {
	columnsPortrait: ColumnsCount;
	columnsLandscape: ColumnsCount;
};

const initialState: AppSettingsSliceState = {
	columnsPortrait: 1,
	columnsLandscape: 2,
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
		},

		setColumnsPortrait(state, action: PayloadAction<ColumnsCount>) {
			state.columnsPortrait = action.payload;
		},

		setColumnsLandscape(state, action: PayloadAction<ColumnsCount>) {
			state.columnsLandscape = action.payload;
		},
	},
});

export const { loadAppSettings, setColumnsPortrait, setColumnsLandscape } = appSettingsSlice.actions;
export default appSettingsSlice.reducer;
