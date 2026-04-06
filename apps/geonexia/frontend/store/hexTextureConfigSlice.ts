import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { HexTextureConfigState, TextureSpriteAnchorOverride } from '../helpers/HexTextureConfigStorage';

// ─── State type ───────────────────────────────────────────────────────────────

export type HexTextureConfigSliceState = {
	/** Sprite index → anchor overrides (anchorX, anchorY, scaleMultiplier) for the flat texture layer. */
	spriteAnchors: HexTextureConfigState;
};

const initialState: HexTextureConfigSliceState = {
	spriteAnchors: {},
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const hexTextureConfigSlice = createSlice({
	name: 'hexTextureConfig',
	initialState,
	reducers: {
		/**
		 * Set the anchor override for a single sprite type in the hex texture layer.
		 * Preserves any existing scaleMultiplier override.
		 */
		setTextureSpriteAnchor(
			state,
			action: PayloadAction<{ spriteIndex: number; anchorX: number; anchorY: number }>,
		) {
			const { spriteIndex, anchorX, anchorY } = action.payload;
			const existing = state.spriteAnchors[spriteIndex];
			state.spriteAnchors[spriteIndex] = {
				...existing,
				anchorX,
				anchorY,
			};
		},

		/**
		 * Set the per-sprite scale multiplier for a single sprite type in the hex texture layer.
		 * Preserves any existing anchor overrides.
		 */
		setTextureSpriteScale(
			state,
			action: PayloadAction<{ spriteIndex: number; scaleMultiplier: number }>,
		) {
			const { spriteIndex, scaleMultiplier } = action.payload;
			const existing = state.spriteAnchors[spriteIndex];
			state.spriteAnchors[spriteIndex] = {
				...existing,
				scaleMultiplier,
			};
		},

		/**
		 * Reset a sprite's anchor and scale overrides for the hex texture layer
		 * (removes the entry entirely, reverting to sprite defaults).
		 */
		resetTextureSpriteAnchor(state, action: PayloadAction<{ spriteIndex: number }>) {
			delete state.spriteAnchors[action.payload.spriteIndex];
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
