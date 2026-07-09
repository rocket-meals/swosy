// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Per-sprite anchor/scale override fields shared by the billboard config
 * (`BillboardConfigStorage.ts`) and hex texture config (`HexTextureConfigStorage.ts`)
 * storage layers.
 */
export type AnchorOverrideFields = {
	/**
	 * Horizontal anchor as a fraction of image width (0 = left, 1 = right).
	 * Falls back to the sprite's default anchorX when undefined.
	 */
	anchorX?: number;
	/**
	 * Vertical anchor as a fraction of image height (0 = top, 1 = bottom).
	 * Falls back to the sprite's default anchorY when undefined.
	 */
	anchorY?: number;
	/** Per-sprite scale multiplier applied on top of the global billboard scale (default 1.0). */
	scaleMultiplier?: number;
};
