import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { BillboardConfigState, SpriteAnchorOverride } from '../helpers/BillboardConfigStorage';

// ─── State type ───────────────────────────────────────────────────────────────

export type BillboardConfigSliceState = {
	/** Sprite index → anchor overrides (anchorX, anchorY). */
	spriteAnchors: BillboardConfigState;
};

const initialState: BillboardConfigSliceState = {
	spriteAnchors: {},
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const billboardConfigSlice = createSlice({
	name: 'billboardConfig',
	initialState,
	reducers: {
		/**
		 * Set the anchor override for a single sprite type.
		 * All billboards of that type will use the new anchor values.
		 */
		setSpriteAnchor(
			state,
			action: PayloadAction<{ spriteIndex: number; anchorX: number; anchorY: number }>,
		) {
			const { spriteIndex, anchorX, anchorY } = action.payload;
			state.spriteAnchors[spriteIndex] = { anchorX, anchorY };
		},

		/**
		 * Reset a sprite's anchor to its default values (removes the override).
		 */
		resetSpriteAnchor(state, action: PayloadAction<{ spriteIndex: number }>) {
			delete state.spriteAnchors[action.payload.spriteIndex];
		},

		/**
		 * Replace the entire state with data loaded from persistent storage.
		 */
		loadPersistedBillboardConfig(
			state,
			action: PayloadAction<BillboardConfigState>,
		) {
			state.spriteAnchors = action.payload;
		},
	},
});

export const { setSpriteAnchor, resetSpriteAnchor, loadPersistedBillboardConfig } = billboardConfigSlice.actions;
export default billboardConfigSlice.reducer;
