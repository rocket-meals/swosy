import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { HexTextureConfigState, TextureSpriteAnchorOverride } from '../helpers/HexTextureConfigStorage';

// ─── State type ───────────────────────────────────────────────────────────────

export type HexTextureConfigSliceState = {
	/** Sprite index → anchor overrides (anchorX, anchorY, scaleMultiplier) for the flat texture layer. */
	spriteAnchors: HexTextureConfigState;
};

const initialState: HexTextureConfigSliceState = {
	spriteAnchors: {
		'Plains/hexPlains00': { scaleMultiplier: 1.6, anchorX: 0.45, anchorY: 0.35 },
		'Grass/grass': { scaleMultiplier: 1.2 },
		'Dirt/dirt': { scaleMultiplier: 1.2 },
	},
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const hexTextureConfigSlice = createSlice({
	name: 'hexTextureConfig',
	initialState,
	reducers: {
		/**
		 * Set the anchor override for a single terrain texture type in the hex texture layer.
		 * Preserves any existing scaleMultiplier override.
		 */
		setTextureSpriteAnchor(
			state,
			action: PayloadAction<{ terrainKey: string; anchorX: number; anchorY: number }>,
		) {
			const { terrainKey, anchorX, anchorY } = action.payload;
			const existing = state.spriteAnchors[terrainKey];
			state.spriteAnchors[terrainKey] = {
				...existing,
				anchorX,
				anchorY,
			};
		},

		/**
		 * Set the per-terrain scale multiplier for a single terrain texture type in the hex texture layer.
		 * Preserves any existing anchor overrides.
		 */
		setTextureSpriteScale(
			state,
			action: PayloadAction<{ terrainKey: string; scaleMultiplier: number }>,
		) {
			const { terrainKey, scaleMultiplier } = action.payload;
			const existing = state.spriteAnchors[terrainKey];
			state.spriteAnchors[terrainKey] = {
				...existing,
				scaleMultiplier,
			};
		},

		/**
		 * Reset a terrain texture's anchor and scale overrides for the hex texture layer
		 * (removes the entry entirely, reverting to defaults).
		 */
		resetTextureSpriteAnchor(state, action: PayloadAction<{ terrainKey: string }>) {
			delete state.spriteAnchors[action.payload.terrainKey];
		},

		/**
		 * Replace the entire state with data loaded from persistent storage.
		 */
		loadPersistedHexTextureConfig(
			state,
			action: PayloadAction<HexTextureConfigState>,
		) {
			state.spriteAnchors = { ...initialState.spriteAnchors, ...action.payload };
		},
	},
});

export const {
	setTextureSpriteAnchor,
	setTextureSpriteScale,
	resetTextureSpriteAnchor,
	loadPersistedHexTextureConfig,
} = hexTextureConfigSlice.actions;
export default hexTextureConfigSlice.reducer;
