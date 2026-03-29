import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── State type ───────────────────────────────────────────────────────────────

export type SpeechSettingsState = {
	/** Master toggle for speech announcements */
	enabled: boolean;
	/** Volume level 0.0 – 1.0 */
	volume: number;
	/** Play TTS over background music (iOS) */
	playOverMusic: boolean;
	/** Pace threshold hint (min per km). If user is faster, a hint is announced. 0 = disabled. */
	paceHintMinutes: number;
	paceHintSeconds: number;
	/** Time interval for periodic announcements (minutes). 0 = disabled. */
	intervalTimeMinutes: number;
	/** Distance interval for periodic announcements (meters). 0 = disabled. */
	intervalDistanceMeters: number;
	/** Play a tone at the specified distance interval */
	toneAtDistance: boolean;
	/** Vibrate at the specified distance interval */
	vibrationAtDistance: boolean;

	// ─── Announcement content toggles ─────────────────────────────────────────
	announceDistance: boolean;
	announceDuration: boolean;
	announcePace: boolean;
	announceSpeed: boolean;
	announceCalories: boolean;
	announceHeartRate: boolean;
};

export const SPEECH_SETTINGS_DEFAULTS: SpeechSettingsState = {
	enabled: true,
	volume: 0.8,
	playOverMusic: false,
	paceHintMinutes: 5,
	paceHintSeconds: 30,
	intervalTimeMinutes: 5,
	intervalDistanceMeters: 1000,
	toneAtDistance: false,
	vibrationAtDistance: false,
	announceDistance: true,
	announceDuration: true,
	announcePace: true,
	announceSpeed: false,
	announceCalories: false,
	announceHeartRate: false,
};

const initialState: SpeechSettingsState = { ...SPEECH_SETTINGS_DEFAULTS };

// ─── Slice ────────────────────────────────────────────────────────────────────

const speechSettingsSlice = createSlice({
	name: 'speechSettings',
	initialState,
	reducers: {
		/** Update one or more speech settings fields at once. */
		updateSpeechSettings(state, action: PayloadAction<Partial<SpeechSettingsState>>) {
			return { ...state, ...action.payload };
		},

		/** Load the full persisted speech settings from disk. Called once at startup. */
		loadSpeechSettings(_state, action: PayloadAction<SpeechSettingsState>) {
			return action.payload;
		},
	},
});

export const { updateSpeechSettings, loadSpeechSettings } = speechSettingsSlice.actions;
export default speechSettingsSlice.reducer;
