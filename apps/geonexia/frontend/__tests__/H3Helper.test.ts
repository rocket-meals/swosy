/**
 * Tests for the H3Helper wrapper (helpers/H3Helper.ts).
 *
 * These tests run under Jest (jest-expo preset, Node environment) and verify
 * that the bundled asm.js H3 library loads, initialises correctly, and
 * produces accurate results for a set of known coordinates.
 *
 * The coordinates used throughout are in the Osnabrück / north-west Germany
 * area (lat ≈ 52.66 °N, lng ≈ 8.13 °E) which is the area referenced in the
 * original bug report.
 */

import {
    isAvailable,
    latLngToCell,
    cellToLatLng,
    cellToBoundary,
    gridDisk,
    gridDistance,
    isValidCell,
    getResolution,
    UNITS,
    greatCircleDistance,
} from '../helpers/H3Helper';

// ─── Known-good fixtures ──────────────────────────────────────────────────────

const LAT = 52.66;
const LNG = 8.13;
const RES = 9;

// Pre-computed expected values (verified against the h3-js reference
// implementation at resolution 9 for the coordinates above).
const EXPECTED_CELL = '891f10d504fffff';
const EXPECTED_CELL_RES_0 = '801ffffffffffff';

// ─── Library availability ─────────────────────────────────────────────────────

describe('H3Helper – library availability', () => {
    it('isAvailable() returns true in the test environment', () => {
        // The asm.js bundle must load and pass its sanity-check in both the
        // Node.js test environment and the React Native / Hermes runtime.
        expect(isAvailable()).toBe(true);
    });
});

// ─── Cell indexing ────────────────────────────────────────────────────────────

describe('H3Helper – cell indexing', () => {
    it('latLngToCell returns a non-empty string for valid coordinates', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        expect(typeof cell).toBe('string');
        expect(cell.length).toBeGreaterThan(0);
    });

    it('latLngToCell returns the expected cell index for known coordinates', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        expect(cell).toBe(EXPECTED_CELL);
    });

    it('latLngToCell returns a different cell for resolution 0', () => {
        const cell = latLngToCell(LAT, LNG, 0);
        expect(cell).toBe(EXPECTED_CELL_RES_0);
    });

    it('latLngToCell throws for NaN coordinates (library validates inputs)', () => {
        // The H3 library validates its inputs and throws H3LibraryError for
        // NaN coordinates.  Callers (e.g. buildH3GeoJson) already guard with
        // try/catch, so this is acceptable behaviour.
        expect(() => latLngToCell(NaN, NaN, RES)).toThrow();
    });

    it('cellToLatLng round-trips correctly', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        const [lat, lng] = cellToLatLng(cell);
        // The centre of the cell containing (LAT, LNG) should be within ~1 km.
        expect(Math.abs(lat - LAT)).toBeLessThan(0.02);
        expect(Math.abs(lng - LNG)).toBeLessThan(0.02);
    });
});

// ─── Cell validation ──────────────────────────────────────────────────────────

describe('H3Helper – cell validation', () => {
    it('isValidCell returns true for a valid cell', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        expect(isValidCell(cell)).toBe(true);
    });

    it('isValidCell returns false for an empty string', () => {
        expect(isValidCell('')).toBe(false);
    });

    it('isValidCell returns false for a random string', () => {
        expect(isValidCell('not-a-cell')).toBe(false);
    });

    it('getResolution returns the correct resolution', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        expect(getResolution(cell)).toBe(RES);
    });
});

// ─── Cell boundary (GeoJSON) ─────────────────────────────────────────────────

describe('H3Helper – cellToBoundary', () => {
    it('returns a non-empty array for a valid cell', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        const boundary = cellToBoundary(cell);
        expect(Array.isArray(boundary)).toBe(true);
        expect(boundary.length).toBeGreaterThan(0);
    });

    it('default [lat, lng] boundary has correct coordinate order', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        const boundary = cellToBoundary(cell, false);
        // Each vertex should be [lat, lng]; latitude of a point near 52 °N
        // must be in the first position.
        const [lat0, lng0] = boundary[0];
        expect(lat0).toBeGreaterThan(50);
        expect(lat0).toBeLessThan(55);
        expect(lng0).toBeGreaterThan(7);
        expect(lng0).toBeLessThan(10);
    });

    it('GeoJSON boundary (formatAsGeoJson=true) has [lng, lat] order and is closed', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        const boundary = cellToBoundary(cell, true);
        // In GeoJSON order the first element is longitude.
        const [lng0, lat0] = boundary[0];
        expect(lng0).toBeGreaterThan(7);
        expect(lng0).toBeLessThan(10);
        expect(lat0).toBeGreaterThan(50);
        expect(lat0).toBeLessThan(55);
        // A closed GeoJSON ring repeats the first vertex at the end.
        const last = boundary[boundary.length - 1];
        expect(last[0]).toBeCloseTo(boundary[0][0], 10);
        expect(last[1]).toBeCloseTo(boundary[0][1], 10);
    });

    it('returns an empty array for an empty string input', () => {
        expect(cellToBoundary('')).toEqual([]);
    });
});

// ─── Grid traversal ───────────────────────────────────────────────────────────

describe('H3Helper – gridDisk', () => {
    it('gridDisk(cell, 0) returns exactly 1 cell (the centre itself)', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        const disk = gridDisk(cell, 0);
        expect(disk).toHaveLength(1);
        expect(disk[0]).toBe(cell);
    });

    it('gridDisk(cell, 1) returns exactly 7 cells', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        const disk = gridDisk(cell, 1);
        expect(disk).toHaveLength(7);
    });

    it('gridDisk(cell, 2) returns exactly 19 cells', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        const disk = gridDisk(cell, 2);
        expect(disk).toHaveLength(19);
    });

    it('all cells returned by gridDisk are valid', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        const disk = gridDisk(cell, 2);
        for (const c of disk) {
            expect(isValidCell(c)).toBe(true);
        }
    });

    it('gridDisk with empty cell returns an empty array', () => {
        expect(gridDisk('', 1)).toEqual([]);
    });

    it('gridDistance between same cell is 0', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        expect(gridDistance(cell, cell)).toBe(0);
    });

    it('gridDistance between adjacent cells is 1', () => {
        const cell = latLngToCell(LAT, LNG, RES);
        const ring1 = gridDisk(cell, 1).filter((c) => c !== cell);
        expect(gridDistance(cell, ring1[0])).toBe(1);
    });
});

// ─── Measurement ─────────────────────────────────────────────────────────────

describe('H3Helper – measurement', () => {
    // UNITS is defined when the H3 library loads; fall back to string literals
    // only as a safety net for environments where isAvailable() is false.
    const KM = UNITS?.km ?? 'km';
    const M = UNITS?.m ?? 'm';

    it('greatCircleDistance between two nearby points is positive and reasonable', () => {
        const a: [number, number] = [LAT, LNG];
        const b: [number, number] = [LAT + 0.01, LNG + 0.01];
        const dist = greatCircleDistance(a, b, KM);
        expect(dist).toBeGreaterThan(0);
        expect(dist).toBeLessThan(5);
    });

    it('greatCircleDistance between identical points is 0', () => {
        const a: [number, number] = [LAT, LNG];
        const dist = greatCircleDistance(a, a, M);
        expect(dist).toBe(0);
    });
});

// ─── Viewport GeoJSON helper (integration) ───────────────────────────────────

describe('H3Helper – viewport GeoJSON integration', () => {
    /**
     * Reproduces the exact `buildH3GeoJson` logic used in the activity screen
     * so we can verify it produces the correct number of cells for the
     * viewport bounds from the bug report.
     */
    const H3_MIN_ZOOM = 14;
    const H3_MAX_CELLS = 5000;
    const H3_GEOJSON_ORDER = true;

    type ViewportBounds = { north: number; south: number; east: number; west: number };

    function buildH3GeoJson(bounds: ViewportBounds, zoom: number, resolution: number) {
        if (zoom < H3_MIN_ZOOM) return { type: 'FeatureCollection' as const, features: [] };

        const centerLat = (bounds.north + bounds.south) / 2;
        const centerLng = (bounds.east + bounds.west) / 2;
        const centerCell = latLngToCell(centerLat, centerLng, resolution);

        const corners: Array<[number, number]> = [
            [bounds.north, bounds.east],
            [bounds.north, bounds.west],
            [bounds.south, bounds.east],
            [bounds.south, bounds.west],
        ];
        let maxK = 0;
        for (const [lat, lng] of corners) {
            try {
                const cornerCell = latLngToCell(lat, lng, resolution);
                const dist = gridDistance(centerCell, cornerCell);
                if (dist > maxK) maxK = dist;
            } catch {
                // gridDistance can throw across icosahedron faces – safe to skip.
            }
        }

        const k = Math.min(maxK + 1, 30);
        const cells = gridDisk(centerCell, k);

        const features: object[] = [];
        for (const cell of cells) {
            if (features.length >= H3_MAX_CELLS) break;
            const boundary = cellToBoundary(cell, H3_GEOJSON_ORDER);
            features.push({
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [boundary] },
                properties: { h3Index: cell },
            });
        }

        return { type: 'FeatureCollection' as const, features };
    }

    it('produces a non-empty FeatureCollection for the bug-report viewport at zoom 16', () => {
        // Bounds from the original bug report (Osnabrück area, zoom 16).
        const bounds = { north: 52.66421, south: 52.65891, east: 8.13581, west: 8.13105 };
        const result = buildH3GeoJson(bounds, 16, 9);
        expect(result.type).toBe('FeatureCollection');
        expect(result.features.length).toBeGreaterThan(0);
    });

    it('produces 0 features when zoom is below H3_MIN_ZOOM', () => {
        const bounds = { north: 52.66421, south: 52.65891, east: 8.13581, west: 8.13105 };
        const result = buildH3GeoJson(bounds, 13, 9);
        expect(result.features).toHaveLength(0);
    });

    it('each feature has a valid h3Index property', () => {
        const bounds = { north: 52.66421, south: 52.65891, east: 8.13581, west: 8.13105 };
        const result = buildH3GeoJson(bounds, 16, 9);
        for (const f of result.features) {
            const feature = f as { properties: { h3Index: string } };
            expect(isValidCell(feature.properties.h3Index)).toBe(true);
        }
    });

    it('each feature Polygon coordinates form a closed GeoJSON ring', () => {
        const bounds = { north: 52.66421, south: 52.65891, east: 8.13581, west: 8.13105 };
        const result = buildH3GeoJson(bounds, 16, 9);
        for (const f of result.features) {
            const feature = f as { geometry: { coordinates: number[][][] } };
            const ring = feature.geometry.coordinates[0];
            expect(ring.length).toBeGreaterThan(0);
            // First and last points must be identical (closed ring).
            const first = ring[0];
            const last = ring[ring.length - 1];
            expect(first[0]).toBeCloseTo(last[0], 10);
            expect(first[1]).toBeCloseTo(last[1], 10);
        }
    });
});

// ─── Half-resolution (fractional) subdivision tests ───────────────────────────

import { cellToChildren, cellToParent, cellToHalfResolutionTiles } from '../helpers/H3Helper';

describe('H3 half-resolution subdivision', () => {
    const BASE_RES = 9;
    const CHILD_RES = BASE_RES + 1;
    const BOUNDS = { north: 52.66421, south: 52.65891, east: 8.13581, west: 8.13105 };
    const H3_MIN_ZOOM = 14;
    const H3_MAX_CELLS = 5000;
    const H3_RESOLUTION_MIN = 0;
    const H3_RESOLUTION_MAX = 15;
    const H3_GEOJSON_ORDER = true;

    /**
     * Mirrors the half-resolution path of buildH3GeoJson in app/index.tsx.
     * Uses cellToHalfResolutionTiles to produce 1 center + 6 petal polygons
     * per parent cell.
     */
    function buildH3GeoJsonHalf(bounds: { north: number; south: number; east: number; west: number }, zoom: number, resolution: number) {
        if (zoom < H3_MIN_ZOOM) return { type: 'FeatureCollection' as const, features: [] };
        const isHalfResolution = resolution % 1 !== 0;
        const h3Res = Math.max(
            H3_RESOLUTION_MIN,
            Math.min(H3_RESOLUTION_MAX, isHalfResolution ? Math.floor(resolution) : Math.round(resolution)),
        );

        const centerLat = (bounds.north + bounds.south) / 2;
        const centerLng = (bounds.east + bounds.west) / 2;
        const centerCell = latLngToCell(centerLat, centerLng, h3Res);

        const corners: Array<[number, number]> = [
            [bounds.north, bounds.east],
            [bounds.north, bounds.west],
            [bounds.south, bounds.east],
            [bounds.south, bounds.west],
        ];
        let maxK = 0;
        for (const [lat, lng] of corners) {
            try {
                const cornerCell = latLngToCell(lat, lng, h3Res);
                const dist = gridDistance(centerCell, cornerCell);
                if (dist > maxK) maxK = dist;
            } catch {
                // ignore
            }
        }

        const k = Math.min(maxK + 1, 30);
        const parentCells = gridDisk(centerCell, k);
        const features: object[] = [];

        if (isHalfResolution) {
            for (const parentCell of parentCells) {
                if (features.length >= H3_MAX_CELLS) break;
                const tiles = cellToHalfResolutionTiles(parentCell, H3_GEOJSON_ORDER);
                for (const tile of tiles) {
                    if (features.length >= H3_MAX_CELLS) break;
                    features.push({
                        type: 'Feature',
                        geometry: { type: 'Polygon', coordinates: [tile.polygon] },
                        properties: { h3Index: parentCell },
                    });
                }
            }
        } else {
            for (const cell of parentCells) {
                if (features.length >= H3_MAX_CELLS) break;
                const boundary = cellToBoundary(cell, H3_GEOJSON_ORDER);
                features.push({
                    type: 'Feature',
                    geometry: { type: 'Polygon', coordinates: [boundary] },
                    properties: { h3Index: cell },
                });
            }
        }

        return { type: 'FeatureCollection' as const, features };
    }

    it('fractional resolution produces more features than the equivalent whole-number resolution', () => {
        const whole = buildH3GeoJsonHalf(BOUNDS, 16, BASE_RES);
        const half = buildH3GeoJsonHalf(BOUNDS, 16, BASE_RES + 0.5);
        // Each parent hex produces 7 tiles (1 center + 6 petals), so half-resolution
        // should produce ~7× more features than the whole-number resolution.
        expect(half.features.length).toBeGreaterThan(whole.features.length);
    });

    it('features from fractional resolution have h3Index at the base (parent) resolution', () => {
        const result = buildH3GeoJsonHalf(BOUNDS, 16, BASE_RES + 0.5);
        expect(result.features.length).toBeGreaterThan(0);
        for (const f of result.features) {
            const feature = f as { properties: { h3Index: string } };
            expect(isValidCell(feature.properties.h3Index)).toBe(true);
            expect(getResolution(feature.properties.h3Index)).toBe(BASE_RES);
        }
    });

    it('features from fractional resolution have closed GeoJSON polygon rings', () => {
        const result = buildH3GeoJsonHalf(BOUNDS, 16, BASE_RES + 0.5);
        expect(result.features.length).toBeGreaterThan(0);
        for (const f of result.features) {
            const feature = f as { geometry: { coordinates: number[][][] } };
            const ring = feature.geometry.coordinates[0];
            expect(ring.length).toBeGreaterThan(0);
            // First and last vertices must be identical (closed ring).
            const first = ring[0];
            const last = ring[ring.length - 1];
            expect(first[0]).toBeCloseTo(last[0], 10);
            expect(first[1]).toBeCloseTo(last[1], 10);
        }
    });

    it('each parent cell yields exactly 7 features (1 center + 6 petals)', () => {
        // Pick the single center cell and verify it produces exactly 7 features.
        const centerLat = (BOUNDS.north + BOUNDS.south) / 2;
        const centerLng = (BOUNDS.east + BOUNDS.west) / 2;
        const parentCell = latLngToCell(centerLat, centerLng, BASE_RES);
        const tiles = cellToHalfResolutionTiles(parentCell, H3_GEOJSON_ORDER);
        expect(tiles).toHaveLength(7);
        expect(tiles[0].isCenter).toBe(true);
        expect(tiles.filter((t) => !t.isCenter)).toHaveLength(6);
    });

    it('H3 library cellToChildren round-trips correctly via cellToParent', () => {
        // Verifies that child cells returned by H3 round-trip to the same parent.
        const parentCell = latLngToCell(
            (BOUNDS.north + BOUNDS.south) / 2,
            (BOUNDS.east + BOUNDS.west) / 2,
            BASE_RES,
        );
        const children = cellToChildren(parentCell, CHILD_RES);
        for (const child of children) {
            expect(cellToParent(child, BASE_RES)).toBe(parentCell);
        }
    });

    it('whole-number resolution is unaffected by the half-resolution logic', () => {
        const whole = buildH3GeoJsonHalf(BOUNDS, 16, BASE_RES);
        // All features should have their own h3Index at the base resolution.
        for (const f of whole.features) {
            const feature = f as { properties: { h3Index: string } };
            expect(getResolution(feature.properties.h3Index)).toBe(BASE_RES);
        }
    });

    it('produces 0 features when zoom is below H3_MIN_ZOOM regardless of fractional resolution', () => {
        const result = buildH3GeoJsonHalf(BOUNDS, 13, BASE_RES + 0.5);
        expect(result.features).toHaveLength(0);
    });
});

// ─── cellToHalfResolutionTiles unit tests ─────────────────────────────────────

describe('H3Helper – cellToHalfResolutionTiles', () => {
    const cell = latLngToCell(LAT, LNG, RES);

    it('returns 7 tiles for a standard hexagonal cell (1 center + 6 petals)', () => {
        const tiles = cellToHalfResolutionTiles(cell);
        expect(tiles).toHaveLength(7);
    });

    it('first tile is the center tile (isCenter=true)', () => {
        const tiles = cellToHalfResolutionTiles(cell);
        expect(tiles[0].isCenter).toBe(true);
    });

    it('the remaining 6 tiles are petals (isCenter=false)', () => {
        const tiles = cellToHalfResolutionTiles(cell);
        for (const t of tiles.slice(1)) {
            expect(t.isCenter).toBe(false);
        }
    });

    it('all tiles reference the correct parent h3Index', () => {
        const tiles = cellToHalfResolutionTiles(cell);
        for (const t of tiles) {
            expect(t.parentH3Index).toBe(cell);
        }
    });

    it('center polygon has 6 vertices in non-GeoJSON mode (ring not closed)', () => {
        const tiles = cellToHalfResolutionTiles(cell, false);
        expect(tiles[0].polygon).toHaveLength(6);
    });

    it('each petal polygon has 4 vertices in non-GeoJSON mode (ring not closed)', () => {
        const tiles = cellToHalfResolutionTiles(cell, false);
        for (const t of tiles.slice(1)) {
            expect(t.polygon).toHaveLength(4);
        }
    });

    it('GeoJSON mode: center polygon is closed and has 7 points (6 + closing vertex)', () => {
        const tiles = cellToHalfResolutionTiles(cell, true);
        const center = tiles[0];
        expect(center.polygon).toHaveLength(7);
        // First and last vertices must be identical.
        expect(center.polygon[0][0]).toBeCloseTo(center.polygon[6][0], 10);
        expect(center.polygon[0][1]).toBeCloseTo(center.polygon[6][1], 10);
    });

    it('GeoJSON mode: each petal polygon is closed and has 5 points (4 + closing vertex)', () => {
        const tiles = cellToHalfResolutionTiles(cell, true);
        for (const t of tiles.slice(1)) {
            expect(t.polygon).toHaveLength(5);
            const first = t.polygon[0];
            const last = t.polygon[t.polygon.length - 1];
            expect(first[0]).toBeCloseTo(last[0], 10);
            expect(first[1]).toBeCloseTo(last[1], 10);
        }
    });

    it('GeoJSON mode: coordinates are [lng, lat] order', () => {
        const tiles = cellToHalfResolutionTiles(cell, true);
        // For Osnabrück area: lng ≈ 8, lat ≈ 52.
        // GeoJSON order is [lng, lat], so the first element should be ~8.
        const [lng0, lat0] = tiles[0].polygon[0];
        expect(lng0).toBeGreaterThan(7);
        expect(lng0).toBeLessThan(10);
        expect(lat0).toBeGreaterThan(50);
        expect(lat0).toBeLessThan(55);
    });

    it('center tile vertices are at exactly 2/3 distance from the centroid', () => {
        const [centerLat, centerLng] = cellToLatLng(cell);
        const outer = cellToBoundary(cell, false) as [number, number][];
        const tiles = cellToHalfResolutionTiles(cell, false);
        const inner = tiles[0].polygon as [number, number][];

        for (let i = 0; i < outer.length; i++) {
            const outerDist = Math.hypot(
                outer[i][0] - centerLat,
                outer[i][1] - centerLng,
            );
            const innerDist = Math.hypot(
                inner[i][0] - centerLat,
                inner[i][1] - centerLng,
            );
            expect(innerDist / outerDist).toBeCloseTo(2 / 3, 5);
        }
    });

    it('petal vertices connect inner and outer hex edges in the correct order', () => {
        const outer = cellToBoundary(cell, false) as [number, number][];
        const tiles = cellToHalfResolutionTiles(cell, false);
        const inner = tiles[0].polygon as [number, number][];
        const n = outer.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const petal = tiles[i + 1].polygon as [number, number][];
            // Expected order: inner[i], outer[i], outer[j], inner[j]
            expect(petal[0][0]).toBeCloseTo(inner[i][0], 8);
            expect(petal[0][1]).toBeCloseTo(inner[i][1], 8);
            expect(petal[1][0]).toBeCloseTo(outer[i][0], 8);
            expect(petal[1][1]).toBeCloseTo(outer[i][1], 8);
            expect(petal[2][0]).toBeCloseTo(outer[j][0], 8);
            expect(petal[2][1]).toBeCloseTo(outer[j][1], 8);
            expect(petal[3][0]).toBeCloseTo(inner[j][0], 8);
            expect(petal[3][1]).toBeCloseTo(inner[j][1], 8);
        }
    });

    it('returns an empty array for an invalid cell', () => {
        expect(cellToHalfResolutionTiles('')).toEqual([]);
        expect(cellToHalfResolutionTiles('not-a-cell')).toEqual([]);
    });

    it('works at different resolutions (res 5 and res 12)', () => {
        for (const res of [5, 12]) {
            const c = latLngToCell(LAT, LNG, res);
            const tiles = cellToHalfResolutionTiles(c);
            // Standard hexagonal cells produce exactly 7 tiles (1 center + 6 petals).
            expect(tiles).toHaveLength(7);
            expect(tiles[0].isCenter).toBe(true);
        }
    });
});
