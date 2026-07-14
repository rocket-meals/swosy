import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ColumnsMode } from '../helpers/AppSettingsStorage';
export type { ColumnsMode };

// ─── State type ───────────────────────────────────────────────────────────────

export type AppSettingsSliceState = {
	columnsMode: ColumnsMode;
};

const initialState: AppSettingsSliceState = {
	columnsMode: 'single',
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const appSettingsSlice = createSlice({
	name: 'appSettings',
	initialState,
	reducers: {
		/** Load persisted app settings from disk. Called once at startup. */
		loadAppSettings(state, action: PayloadAction<AppSettingsSliceState>) {
			state.columnsMode = action.payload.columnsMode;
		},

		setColumnsMode(state, action: PayloadAction<ColumnsMode>) {
			state.columnsMode = action.payload;
		},
	},
});

export const { loadAppSettings, setColumnsMode } = appSettingsSlice.actions;
export default appSettingsSlice.reducer;
