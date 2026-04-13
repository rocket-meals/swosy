import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapStyleKey } from 'repo-depkit-common-ui';

// ─── State type ───────────────────────────────────────────────────────────────

export type DisplaySettingsState = {
	/** Visual style for the base map. */
	mapTheme: MapStyleKey;
	/** Opacity of the hex grid lines (0.0 – 1.0). Scales the base zoom-dependent opacity of the stroke layer. */
	hexLineOpacity: number;
	/** Width multiplier for the hex grid lines (0.1 – 3.0). Scales the base zoom-dependent width of the stroke layer. */
	hexLineWidth: number;
	/** Opacity for the hex terrain texture image overlays (0.0 – 1.0). */
	hexTextureOpacity: number;
	/** Opacity for flat hex texture adaption sprites at anchor positions (0.0 – 1.0). */
	hexTextureAdaptionOpacity: number;
	/** Opacity for face-camera hex object sprites at anchor positions (0.0 – 1.0). */
	hexObjectOpacity: number;
	/** Whether to apply centre-line projection (road-snap smoothing) when displaying activity routes. */
	routeSmoothingEnabled: boolean;
	/** Whether to render raw GPS measurement points on the activity map. */
	showGpsPoints: boolean;
};

export const DISPLAY_SETTINGS_DEFAULTS: DisplaySettingsState = {
	mapTheme: MapStyleKey.DEFAULT,
	hexLineOpacity: 1.0,
	hexLineWidth: 1.0,
	hexTextureOpacity: 0.9,
	hexTextureAdaptionOpacity: 0.9,
	hexObjectOpacity: 0.9,
	routeSmoothingEnabled: true,
	showGpsPoints: false,
};

const initialState: DisplaySettingsState = { ...DISPLAY_SETTINGS_DEFAULTS };

// ─── Slice ────────────────────────────────────────────────────────────────────

const displaySettingsSlice = createSlice({
	name: 'displaySettings',
	initialState,
	reducers: {
		/** Update one or more display settings fields at once. */
		updateDisplaySettings(state, action: PayloadAction<Partial<DisplaySettingsState>>) {
			return { ...state, ...action.payload };
		},

		/** Load the full persisted display settings from disk. Called once at startup. */
		loadDisplaySettings(_state, action: PayloadAction<DisplaySettingsState>) {
			return action.payload;
		},
	},
});

export const { updateDisplaySettings, loadDisplaySettings } = displaySettingsSlice.actions;
export default displaySettingsSlice.reducer;
