import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapStyleKey } from 'repo-depkit-common-ui';

// ─── State type ───────────────────────────────────────────────────────────────

export type DisplaySettingsState = {
	/** Fill opacity for hex tiles on the map (0.0 – 1.0). Applied as the max level opacity; level-1 tiles use 70 % of this value. */
	hexTileOpacity: number;
	/** Opacity for objects placed on hex tiles – terrain images and billboard icons (0.0 – 1.0). */
	objectOpacity: number;
	/** Visual style for the base map. */
	mapTheme: MapStyleKey;
	/** Opacity of the hex grid lines (0.0 – 1.0). Scales the base zoom-dependent opacity of the stroke layer. */
	hexLineOpacity: number;
	/** Width multiplier for the hex grid lines (0.1 – 3.0). Scales the base zoom-dependent width of the stroke layer. */
	hexLineWidth: number;
	/** When true, H3 hex cells are rendered as visually regular hexagons in screen space, compensating for Mercator distortion. */
	normalizeHexShape: boolean;
};

export const DISPLAY_SETTINGS_DEFAULTS: DisplaySettingsState = {
	hexTileOpacity: 0.05,
	objectOpacity: 0.35,
	mapTheme: MapStyleKey.DEFAULT,
	hexLineOpacity: 1.0,
	hexLineWidth: 1.0,
	normalizeHexShape: false,
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
