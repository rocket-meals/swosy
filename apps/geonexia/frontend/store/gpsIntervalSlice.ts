import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GpsIntervalMode } from '../helpers/GpsIntervalStorage';
export type { GpsIntervalMode };

// ─── State type ───────────────────────────────────────────────────────────────

export type GpsIntervalSliceState = {
	selectedMode: GpsIntervalMode;
};

const initialState: GpsIntervalSliceState = {
	selectedMode: 'default',
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const gpsIntervalSlice = createSlice({
	name: 'gpsInterval',
	initialState,
	reducers: {
		/**
		 * Set the active GPS interval mode. Persisted to disk by the store subscriber.
		 */
		setGpsIntervalMode(state, action: PayloadAction<GpsIntervalMode>) {
			state.selectedMode = action.payload;
		},

		/**
		 * Load the persisted GPS interval mode from disk. Called once at app startup.
		 */
		loadGpsIntervalMode(state, action: PayloadAction<GpsIntervalMode>) {
			state.selectedMode = action.payload;
		},
	},
});

export const { setGpsIntervalMode, loadGpsIntervalMode } = gpsIntervalSlice.actions;
export default gpsIntervalSlice.reducer;
