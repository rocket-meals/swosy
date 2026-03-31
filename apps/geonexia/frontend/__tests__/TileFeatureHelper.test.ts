/**
 * Tests for TileFeatureHelper – fetching vector-tile features for an H3 hex cell.
 *
 * These tests call the real OpenFreeMap tiling server to download PBF vector
 * tiles for the H3 cell `8a1f10d5061ffff` (resolution 10, Dinklage / north-west
 * Germany area) and verify that the returned features match the expected set.
 *
 * The cell boundary is:
 *   lat: 52.6599 – 52.6611
 *   lng: 8.1375 – 8.1396
 *
 * At zoom 14 the tile server returns features from layers such as roads,
 * buildings, parks, and land cover.
 */

import {
	queryTileFeaturesForBounds,
	getTilesForBounds,
} from '../helpers/TileFeatureHelper';

import {
	isAvailable as isH3Available,
	cellToBoundary,
	getResolution,
	isValidCell,
} from '../helpers/H3Helper';

import type { MapFeatureInfo } from '../helpers/RouteNameSuggestionHelper';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const HEX_ID = '8a1f10d5061ffff';
const FEATURE_QUERY_ZOOM = 14;

/**
 * Expected features returned by the tile server for the hex cell at zoom 14.
 * These were verified manually and represent the stable set of geographic
 * features that intersect the cell's bounding box.
 */
const EXPECTED_FEATURES: MapFeatureInfo[] = [
	{
		layerId: 'highway-shield-non-us',
		name: 'Lohner Straße',
		class: 'secondary',
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
	{
		layerId: 'building-3d',
		name: null,
		class: null,
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
	{
		layerId: 'road_secondary_tertiary',
		name: null,
		class: 'secondary',
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
	{
		layerId: 'road_minor',
		name: null,
		class: 'minor',
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
	{
		layerId: 'road_service_track',
		name: null,
		class: 'service',
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
	{
		layerId: 'road_path_pedestrian',
		name: null,
		class: 'path',
		subclass: 'path',
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
	{
		layerId: 'road_secondary_tertiary_casing',
		name: null,
		class: 'secondary',
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
	{
		layerId: 'road_minor_casing',
		name: null,
		class: 'minor',
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
	{
		layerId: 'road_service_track_casing',
		name: null,
		class: 'service',
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
	{
		layerId: 'landcover_wood',
		name: null,
		class: 'wood',
		subclass: 'forest',
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
	{
		layerId: 'park_outline',
		name: 'Burgwald Dinklage',
		class: 'naturschutzgebiet',
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
	{
		layerId: 'park',
		name: 'Burgwald Dinklage',
		class: 'naturschutzgebiet',
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	},
];

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

describe('TileFeatureHelper – hex cell feature query', () => {
	// These tests hit the real tile server – allow extra time.
	jest.setTimeout(30_000);

	it('H3 library is available and recognises the test cell', () => {
		expect(isH3Available()).toBe(true);
		expect(isValidCell(HEX_ID)).toBe(true);
		expect(getResolution(HEX_ID)).toBe(10);
	});

	it('getTilesForBounds returns at least one tile for the hex bounding box', () => {
		const bounds = getHexBounds(HEX_ID);
		const tiles = getTilesForBounds(
			bounds.minLat,
			bounds.minLng,
			bounds.maxLat,
			bounds.maxLng,
			FEATURE_QUERY_ZOOM,
		);
		expect(tiles.length).toBeGreaterThan(0);
		for (const t of tiles) {
			expect(t.z).toBe(FEATURE_QUERY_ZOOM);
		}
	});

	it('fetches expected features for hex 8a1f10d5061ffff at resolution 10', async () => {
		const bounds = getHexBounds(HEX_ID);
		const features = await queryTileFeaturesForBounds({
			minLat: bounds.minLat,
			minLng: bounds.minLng,
			maxLat: bounds.maxLat,
			maxLng: bounds.maxLng,
			zoom: FEATURE_QUERY_ZOOM,
		});

		// Verify we got features back
		expect(features.length).toBeGreaterThan(0);

		// Each expected feature must appear in the result set.
		// We compare by layerId + name + class + subclass as a unique key.
		for (const expected of EXPECTED_FEATURES) {
			const found = features.find(
				(f) =>
					f.layerId === expected.layerId &&
					f.name === expected.name &&
					f.class === expected.class &&
					f.subclass === expected.subclass,
			);
			expect(found).toBeDefined();
			if (found) {
				expect(found).toEqual(expected);
			}
		}
	});

	it('returns features with the correct MapFeatureInfo shape', async () => {
		const bounds = getHexBounds(HEX_ID);
		const features = await queryTileFeaturesForBounds({
			minLat: bounds.minLat,
			minLng: bounds.minLng,
			maxLat: bounds.maxLat,
			maxLng: bounds.maxLng,
			zoom: FEATURE_QUERY_ZOOM,
		});

		for (const feat of features) {
			expect(feat).toHaveProperty('layerId');
			expect(feat).toHaveProperty('name');
			expect(feat).toHaveProperty('class');
			expect(feat).toHaveProperty('subclass');
			expect(feat).toHaveProperty('highway');
			expect(feat).toHaveProperty('waterway');
			expect(feat).toHaveProperty('building');
			expect(feat).toHaveProperty('natural');
			expect(feat).toHaveProperty('landuse');
			expect(feat).toHaveProperty('amenity');
		}
	});
});
