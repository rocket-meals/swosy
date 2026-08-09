import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AUTO_PAUSE_DEFAULT_DELAY_SECONDS, AUTO_PAUSE_DEFAULT_ENABLED } from '../helpers/AutoPauseHelper';

// ─── State type ───────────────────────────────────────────────────────────────

export type AutoPauseSettingsState = {
	/** Automatically pause the recording when the GPS position stops moving. */
	enabled: boolean;
	/** Seconds without movement before the recording is auto-paused. */
	delaySeconds: number;
};

export const AUTO_PAUSE_SETTINGS_DEFAULTS: AutoPauseSettingsState = {
	enabled: AUTO_PAUSE_DEFAULT_ENABLED,
	delaySeconds: AUTO_PAUSE_DEFAULT_DELAY_SECONDS,
};

const initialState: AutoPauseSettingsState = { ...AUTO_PAUSE_SETTINGS_DEFAULTS };

// ─── Slice ────────────────────────────────────────────────────────────────────

const autoPauseSlice = createSlice({
	name: 'autoPause',
	initialState,
	reducers: {
		/** Update one or more auto-pause settings fields at once. */
		updateAutoPauseSettings(state, action: PayloadAction<Partial<AutoPauseSettingsState>>) {
			return { ...state, ...action.payload };
		},

		/** Load the full persisted auto-pause settings from disk. Called once at startup. */
		loadAutoPauseSettings(_state, action: PayloadAction<AutoPauseSettingsState>) {
			return action.payload;
		},
	},
});

export const { updateAutoPauseSettings, loadAutoPauseSettings } = autoPauseSlice.actions;
export default autoPauseSlice.reducer;
