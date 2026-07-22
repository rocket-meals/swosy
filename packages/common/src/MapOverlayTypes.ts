/**
 * Minimal identity/opacity fields shared by tile/image overlay descriptors
 * across apps (rocket-meals MyMap layers, geonexia hex-terrain overlays), so
 * the field shapes stay in sync instead of being duplicated per app.
 */
export type MapOverlayIdentity = {
	id: string;
	url: string;
	opacity: number;
};
