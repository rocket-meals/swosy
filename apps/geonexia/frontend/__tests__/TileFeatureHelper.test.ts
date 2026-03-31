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
	queryTileFeaturesForAreas,
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

describe('TileFeatureHelper – batch API', () => {
	it('queryTileFeaturesForAreas returns one result array per input area', async () => {
		// Mock fetch: return valid style JSON for style URL, 404 for tile PBFs.
		const originalFetch = globalThis.fetch;
		const mockStyle = {
			sources: {
				openmaptiles: {
					type: 'vector',
					tiles: ['https://example.test/tiles/{z}/{x}/{y}.pbf'],
				},
			},
		};
		globalThis.fetch = jest.fn().mockImplementation((url: string) => {
			if (typeof url === 'string' && url.includes('.pbf')) {
				return Promise.resolve({ ok: false, status: 404 });
			}
			// Style URL
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockStyle),
			});
		});

		try {
			const bounds1 = getHexBounds(HEX_ID);
			const bounds2 = {
				minLat: bounds1.minLat + 0.01,
				minLng: bounds1.minLng + 0.01,
				maxLat: bounds1.maxLat + 0.01,
				maxLng: bounds1.maxLng + 0.01,
			};

			const results = await queryTileFeaturesForAreas([bounds1, bounds2]);

			expect(results).toHaveLength(2);
			expect(Array.isArray(results[0])).toBe(true);
			expect(Array.isArray(results[1])).toBe(true);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it('queryTileFeaturesForAreas returns empty array for empty input', async () => {
		const results = await queryTileFeaturesForAreas([]);
		expect(results).toHaveLength(0);
	});
});
