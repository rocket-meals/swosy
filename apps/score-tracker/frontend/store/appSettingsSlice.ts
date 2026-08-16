import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppSettingsBase, ColumnsCount, GamesSortMode } from '../helpers/AppSettingsStorage';
export type { ColumnsCount, GamesSortMode };

// ─── State type ───────────────────────────────────────────────────────────────

export type AppSettingsSliceState = AppSettingsBase & {
	/**
	 * Whether the first-launch onboarding was completed (or skipped).
	 * `undefined` until the persisted settings are hydrated - the onboarding
	 * gate in app/_layout only shows the intro once this resolved to `false`,
	 * so returning users never see it flash while the state loads.
	 */
	onboardingCompleted: boolean | undefined;
};

const initialState: AppSettingsSliceState = {
	columnsPortrait: 1,
	columnsLandscape: 2,
	gamesSortMode: 'lastPlayed',
	onboardingCompleted: undefined,
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
			state.onboardingCompleted = action.payload.onboardingCompleted === true;
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

		/**
		 * Mark the first-launch onboarding as done (or reset it to `false` via the
		 * settings screen's "Einführung erneut ansehen" row, which shows it again).
		 */
		setOnboardingCompleted(state, action: PayloadAction<boolean>) {
			state.onboardingCompleted = action.payload;
		},
	},
});

export const { loadAppSettings, setColumnsPortrait, setColumnsLandscape, setGamesSortMode, setOnboardingCompleted } = appSettingsSlice.actions;
export default appSettingsSlice.reducer;
