/**
 * Tests for TileFeatureHelper – tile coordinate and bounding-box helpers.
 *
 * These tests verify the tile-coordinate pipeline for H3 cell
 * `8a1f10d5061ffff` (resolution 10, Dinklage / north-west Germany area).
 *
 * The cell boundary is:
 *   lat: 52.6599 – 52.6611
 *   lng: 8.1375 – 8.1396
 *
 * At zoom 14 the bounding box falls into a single tile (14/8562/5362).
 */

import {
	getTilesForBounds,
	calculateOptimalZoom,
} from '../helpers/TileFeatureHelper';

import {
	isAvailable as isH3Available,
	cellToBoundary,
	getResolution,
	isValidCell,
} from '../helpers/H3Helper';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const HEX_ID = '8a1f10d5061ffff';
const FEATURE_QUERY_ZOOM = 14;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Compute the bounding box of an H3 cell from its boundary vertices. */
function getHexBounds(h3Index: string): {
	minLat: number;
	minLng: number;
	maxLat: number;
	maxLng: number;
} {
	const boundary = cellToBoundary(h3Index); // [[lat, lng], ...]
	const lats = boundary.map((v) => v[0]);
	const lngs = boundary.map((v) => v[1]);
	return {
		minLat: Math.min(...lats),
		minLng: Math.min(...lngs),
		maxLat: Math.max(...lats),
		maxLng: Math.max(...lngs),
	};
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('TileFeatureHelper – tile coordinate helpers', () => {
	it('H3 library is available and recognises the test cell', () => {
		expect(isH3Available()).toBe(true);
		expect(isValidCell(HEX_ID)).toBe(true);
		expect(getResolution(HEX_ID)).toBe(10);
	});

	it('hex cell boundary produces valid lat/lng bounds', () => {
		const bounds = getHexBounds(HEX_ID);
		// Cell is in the Dinklage area (north-west Germany)
		expect(bounds.minLat).toBeGreaterThan(52.65);
		expect(bounds.maxLat).toBeLessThan(52.67);
		expect(bounds.minLng).toBeGreaterThan(8.13);
		expect(bounds.maxLng).toBeLessThan(8.15);
	});

	it('getTilesForBounds returns exactly one tile (14/8562/5362) for the hex bounding box', () => {
		const bounds = getHexBounds(HEX_ID);
		const tiles = getTilesForBounds(
			bounds.minLat,
			bounds.minLng,
			bounds.maxLat,
			bounds.maxLng,
			FEATURE_QUERY_ZOOM,
		);
		expect(tiles).toHaveLength(1);
		expect(tiles[0]).toEqual({ z: 14, x: 8562, y: 5362 });
	});

	it('calculateOptimalZoom returns zoom 14 for the small hex cell', () => {
		const bounds = getHexBounds(HEX_ID);
		const zoom = calculateOptimalZoom(bounds.minLat, bounds.minLng, bounds.maxLat, bounds.maxLng);
		expect(zoom).toBe(14);
	});

	it('calculateOptimalZoom reduces zoom for large areas', () => {
		// A ~10° × 10° box should require a lower zoom to fit in ≤4×4 tiles
		const zoom = calculateOptimalZoom(45.0, 5.0, 55.0, 15.0);
		expect(zoom).toBeLessThan(10);
		expect(zoom).toBeGreaterThanOrEqual(1);
	});
});
