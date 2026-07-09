/**
 * Shared geographic viewport-bounds type.
 *
 * Extracted so screens that receive `MapViewportChanged` messages from the
 * map (e.g. `app/index.tsx` and `app/experimental/seaphara/index.tsx`) share
 * a single canonical declaration instead of each redeclaring the same shape.
 */
export type ViewportBounds = {
	north: number;
	south: number;
	east: number;
	west: number;
};
