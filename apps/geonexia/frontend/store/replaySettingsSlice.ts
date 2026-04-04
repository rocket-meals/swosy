import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── State type ───────────────────────────────────────────────────────────────

export type ReplaySettingsState = {
	/** When true, the Rückblende (GPS replay animation) is disabled. */
	isDisabled: boolean;
	/** Playback speed multiplier for the Rückblende animation (e.g. 3.0 = 3× real speed). */
	speed: number;
};

export const REPLAY_SETTINGS_DEFAULTS: ReplaySettingsState = {
	isDisabled: false,
	speed: 3.0,
};

const initialState: ReplaySettingsState = { ...REPLAY_SETTINGS_DEFAULTS };

// ─── Slice ────────────────────────────────────────────────────────────────────

const replaySettingsSlice = createSlice({
	name: 'replaySettings',
	initialState,
	reducers: {
		/** Update one or more replay settings fields at once. */
		updateReplaySettings(state, action: PayloadAction<Partial<ReplaySettingsState>>) {
			return { ...state, ...action.payload };
		},

		/** Load the full persisted replay settings from disk. Called once at startup. */
		loadReplaySettings(_state, action: PayloadAction<ReplaySettingsState>) {
			return action.payload;
		},
	},
});

export const { updateReplaySettings, loadReplaySettings } = replaySettingsSlice.actions;
export default replaySettingsSlice.reducer;
