import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GPS_INTERVAL_DEFAULT_SECONDS } from '../helpers/GpsIntervalStorage';

// ─── State type ───────────────────────────────────────────────────────────────

export type GpsIntervalSliceState = {
	intervalSeconds: number;
};

const initialState: GpsIntervalSliceState = {
	intervalSeconds: GPS_INTERVAL_DEFAULT_SECONDS,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const gpsIntervalSlice = createSlice({
	name: 'gpsInterval',
	initialState,
	reducers: {
		/**
		 * Set the GPS poll interval in seconds. Persisted to disk by the store subscriber.
		 */
		setGpsIntervalSeconds(state, action: PayloadAction<number>) {
			state.intervalSeconds = action.payload;
		},

		/**
		 * Load the persisted GPS interval in seconds from disk. Called once at app startup.
		 */
		loadGpsIntervalSeconds(state, action: PayloadAction<number>) {
			state.intervalSeconds = action.payload;
		},
	},
});

export const { setGpsIntervalSeconds, loadGpsIntervalSeconds } = gpsIntervalSlice.actions;
export default gpsIntervalSlice.reducer;
