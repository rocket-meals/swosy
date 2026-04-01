/**
 * Tests for RouteNameSuggestionHelper – route-name suggestion logic and the
 * high-level hex-tile → name-suggestion API.
 */

import {
	type MapFeatureInfo,
	type AreaInfoDict,
	buildAreaInfoDict,
	suggestRouteNames,
	filterUsedNames,
	hexTilesToAreaParams,
	suggestRouteNamesForHexTiles,
} from '../helpers/RouteNameSuggestionHelper';

import {
	hexCellToBounds,
	preloadMapStyle,
} from '../helpers/TileFeatureHelper';

import {
	isAvailable as isH3Available,
	cellToBoundary,
	isValidCell,
} from '../helpers/H3Helper';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const HEX_ID = '8a1f10d5061ffff'; // resolution 10, Dinklage, Germany

// ─── hexCellToBounds ────────────────────────────────────────────────────────

describe('hexCellToBounds', () => {
	it('returns correct bounds for a valid H3 cell', () => {
		expect(isH3Available()).toBe(true);
		const bounds = hexCellToBounds(HEX_ID);
		expect(bounds.minLat).toBeGreaterThan(52.65);
		expect(bounds.maxLat).toBeLessThan(52.67);
		expect(bounds.minLng).toBeGreaterThan(8.13);
		expect(bounds.maxLng).toBeLessThan(8.15);
		expect(bounds.minLat).toBeLessThan(bounds.maxLat);
		expect(bounds.minLng).toBeLessThan(bounds.maxLng);
	});

	it('matches manually computed boundary bounds', () => {
		const boundary = cellToBoundary(HEX_ID);
		const lats = boundary.map((v) => v[0]);
		const lngs = boundary.map((v) => v[1]);
		const expected = {
			minLat: Math.min(...lats),
			minLng: Math.min(...lngs),
			maxLat: Math.max(...lats),
			maxLng: Math.max(...lngs),
		};

		const bounds = hexCellToBounds(HEX_ID);
		expect(bounds.minLat).toBeCloseTo(expected.minLat, 10);
		expect(bounds.minLng).toBeCloseTo(expected.minLng, 10);
		expect(bounds.maxLat).toBeCloseTo(expected.maxLat, 10);
		expect(bounds.maxLng).toBeCloseTo(expected.maxLng, 10);
	});

	it('throws for an invalid H3 cell', () => {
		expect(() => hexCellToBounds('invalid_cell')).toThrow();
	});
});

// ─── hexTilesToAreaParams ───────────────────────────────────────────────────

describe('hexTilesToAreaParams', () => {
	it('converts valid hex tiles to area params', () => {
		const params = hexTilesToAreaParams([HEX_ID]);
		expect(params).toHaveLength(1);
		expect(params[0]).toHaveProperty('minLat');
		expect(params[0]).toHaveProperty('minLng');
		expect(params[0]).toHaveProperty('maxLat');
		expect(params[0]).toHaveProperty('maxLng');
		expect(params[0]).toHaveProperty('filterOptions');
	});

	it('silently skips invalid hex tiles', () => {
		const params = hexTilesToAreaParams([HEX_ID, 'bad_cell', HEX_ID]);
		expect(params).toHaveLength(2);
	});

	it('returns empty array for empty input', () => {
		expect(hexTilesToAreaParams([])).toHaveLength(0);
	});
});

// ─── buildAreaInfoDict ──────────────────────────────────────────────────────

describe('buildAreaInfoDict', () => {
	const parkFeature: MapFeatureInfo = {
		layerId: 'park',
		name: 'Stadtpark',
		class: 'park',
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	};

	const roadFeature: MapFeatureInfo = {
		layerId: 'transportation_name',
		name: 'Hauptstraße',
		class: 'primary',
		subclass: null,
		highway: 'primary',
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	};

	it('aggregates features from multiple tiles', () => {
		const tileFeatures: Record<string, MapFeatureInfo[]> = {
			'tile-0': [parkFeature, roadFeature],
			'tile-1': [parkFeature],
		};
		const dict = buildAreaInfoDict(tileFeatures);
		expect(dict['park::Stadtpark'].count).toBe(2);
		expect(dict['transportation_name::Hauptstraße'].count).toBe(1);
	});

	it('returns empty dict for empty input', () => {
		expect(buildAreaInfoDict({})).toEqual({});
	});
});

// ─── suggestRouteNames ──────────────────────────────────────────────────────

describe('suggestRouteNames', () => {
	it('returns named park features with high priority', () => {
		const routeDict: AreaInfoDict = {
			'park::Bürgerpark': {
				layerId: 'park',
				name: 'Bürgerpark',
				count: 3,
				class: 'park',
				subclass: null,
				highway: null,
				waterway: null,
				building: null,
				natural: null,
				landuse: null,
				amenity: null,
			},
		};
		const suggestions = suggestRouteNames(routeDict, {});
		expect(suggestions.length).toBeGreaterThan(0);
		expect(suggestions[0]).toBe('Bürgerpark');
	});

	it('generates "Runde um" suggestions for enclosed features', () => {
		const enclosedDict: AreaInfoDict = {
			'water::Badesee': {
				layerId: 'water',
				name: 'Badesee',
				count: 2,
				class: null,
				subclass: null,
				highway: null,
				waterway: null,
				building: null,
				natural: null,
				landuse: null,
				amenity: null,
			},
		};
		const suggestions = suggestRouteNames({}, enclosedDict);
		expect(suggestions).toContain('Runde um Badesee');
	});

	it('returns suggestions sorted by score descending', () => {
		const routeDict: AreaInfoDict = {
			'highway::Feldweg': {
				layerId: 'highway',
				name: 'Feldweg',
				count: 1,
				class: null,
				subclass: null,
				highway: 'residential',
				waterway: null,
				building: null,
				natural: null,
				landuse: null,
				amenity: null,
			},
			'park::Schlosspark': {
				layerId: 'park',
				name: 'Schlosspark',
				count: 5,
				class: 'park',
				subclass: null,
				highway: null,
				waterway: null,
				building: null,
				natural: null,
				landuse: null,
				amenity: null,
			},
		};
		const suggestions = suggestRouteNames(routeDict, {});
		// Park has much higher weight than highway, so should come first
		expect(suggestions.indexOf('Schlosspark')).toBeLessThan(suggestions.indexOf('Feldweg'));
	});
});

// ─── filterUsedNames ────────────────────────────────────────────────────────

describe('filterUsedNames', () => {
	it('removes already-used names (case insensitive)', () => {
		const result = filterUsedNames(
			['Bürgerpark', 'Waldweg', 'Seeblick'],
			['bürgerpark', 'SEEBLICK'],
		);
		expect(result).toEqual(['Waldweg']);
	});

	it('keeps the route own name even if in existing names', () => {
		const result = filterUsedNames(
			['Bürgerpark', 'Waldweg'],
			['bürgerpark', 'waldweg'],
			'Bürgerpark',
		);
		expect(result).toEqual(['Bürgerpark']);
	});
});

// ─── preloadMapStyle ────────────────────────────────────────────────────────

describe('preloadMapStyle', () => {
	it('returns a tile URL template string', async () => {
		const originalFetch = globalThis.fetch;
		const mockStyle = {
			sources: {
				openmaptiles: {
					type: 'vector',
					tiles: ['https://example.test/tiles/{z}/{x}/{y}.pbf'],
				},
			},
		};
		globalThis.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockStyle),
		});

		try {
			const url = await preloadMapStyle('https://mock-style.test');
			expect(url).toBe('https://example.test/tiles/{z}/{x}/{y}.pbf');
			expect(url).toContain('{z}');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});

// ─── suggestRouteNamesForHexTiles (integration) ─────────────────────────────

describe('suggestRouteNamesForHexTiles', () => {
	const parkFeature: MapFeatureInfo = {
		layerId: 'park',
		name: 'Stadtpark',
		class: 'park',
		subclass: null,
		highway: null,
		waterway: null,
		building: null,
		natural: null,
		landuse: null,
		amenity: null,
	};

	/** Helper: mock fetch to return a style + empty PBF tiles. */
	function setupMockFetch() {
		const originalFetch = globalThis.fetch;
		const mockStyle = {
			sources: {
				openmaptiles: {
					type: 'vector',
					tiles: ['https://mock.test/tiles/{z}/{x}/{y}.pbf'],
				},
			},
		};
		globalThis.fetch = jest.fn().mockImplementation((url: string) => {
			if (typeof url === 'string' && url.includes('.pbf')) {
				// Return 404 for tile fetches (empty tiles)
				return Promise.resolve({ ok: false, status: 404 });
			}
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve(mockStyle),
			});
		});
		return originalFetch;
	}

	it('returns an array of suggestions for valid hex tiles', async () => {
		const originalFetch = setupMockFetch();
		try {
			const suggestions = await suggestRouteNamesForHexTiles([HEX_ID]);
			// With 404 tiles (no features), suggestions will be empty
			expect(Array.isArray(suggestions)).toBe(true);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it('returns empty array for empty input', async () => {
		const suggestions = await suggestRouteNamesForHexTiles([]);
		expect(suggestions).toEqual([]);
	});

	it('filters existing names from suggestions', async () => {
		const originalFetch = setupMockFetch();
		try {
			const suggestions = await suggestRouteNamesForHexTiles(
				[HEX_ID],
				[],
				['Stadtpark'],
			);
			expect(suggestions).not.toContain('Stadtpark');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
