import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── State type ───────────────────────────────────────────────────────────────

export type TTSSliceState = {
	ttsEnabled: boolean;
};

const initialState: TTSSliceState = {
	ttsEnabled: true,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const ttsSlice = createSlice({
	name: 'tts',
	initialState,
	reducers: {
		/**
		 * Enable or disable text-to-speech announcements during recording.
		 * Persisted to disk by the store subscriber.
		 */
		setTTSEnabled(state, action: PayloadAction<boolean>) {
			state.ttsEnabled = action.payload;
		},

		/**
		 * Load the persisted TTS enabled flag from disk. Called once at app startup.
		 */
		loadTTSEnabled(state, action: PayloadAction<boolean>) {
			state.ttsEnabled = action.payload;
		},
	},
});

export const { setTTSEnabled, loadTTSEnabled } = ttsSlice.actions;
export default ttsSlice.reducer;
