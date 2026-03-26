/*
 * H3Helper.ts – Wrapper around the h3-js v4.4.0 library bundled locally.
 *
 * The h3-js npm package (which uses emscripten/asm.js) caused issues when
 * bundled via Metro because Metro applies the package.json "browser" field
 * which selects a WASM-based build incompatible with Hermes. This file imports
 * the pre-built asm.js dist directly from a local path, bypassing Metro's
 * conditional-exports resolution entirely.
 *
 * The require is wrapped in a try-catch so that any runtime initialization
 * failure of the asm.js bundle (e.g. a Hermes quirk) does NOT crash the
 * importing module.  All exported helpers gracefully return safe empty values
 * when the library is unavailable, allowing the activity screen to load and
 * render normally while the hex-tile overlay simply stays empty.
 *
 * Based on the H3 library by Uber Technologies, Inc.
 * Licensed under the Apache License, Version 2.0
 * https://github.com/uber/h3
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
let _h3: Partial<typeof import('./h3/libh3')> = {};
let _h3Available = false;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _h3 = require('./h3/libh3') as typeof import('./h3/libh3');
    // Quick sanity-check: (0, 0) is a valid coordinate (Gulf of Guinea at res 0),
    // so this will return a non-empty string if the library initialised correctly.
    const _probe = (_h3 as typeof import('./h3/libh3')).latLngToCell?.(0, 0, 0);
    if (_probe && typeof _probe === 'string' && _probe.length > 0) {
        _h3Available = true;
    } else {
        console.warn('[H3Helper] libh3.js loaded but initialisation check failed – H3 functions will be unavailable.');
        _h3 = {};
    }
} catch (err) {
    console.warn('[H3Helper] libh3.js failed to load – H3 functions will be unavailable.', err);
}

/**
 * Returns `true` when the bundled H3 library has loaded and passed its
 * initialisation sanity-check.  When `false`, all exported H3 helpers will
 * silently return safe empty values.
 */
export const isAvailable = (): boolean => _h3Available;

const {
    latLngToCell: _latLngToCell,
    cellToLatLng: _cellToLatLng,
    cellToBoundary: _cellToBoundary,
    isValidCell: _isValidCell,
    isValidIndex: _isValidIndex,
    isPentagon: _isPentagon,
    isResClassIII: _isResClassIII,
    getResolution: _getResolution,
    getBaseCellNumber: _getBaseCellNumber,
    getIcosahedronFaces: _getIcosahedronFaces,
    cellToParent: _cellToParent,
    cellToChildren: _cellToChildren,
    cellToChildrenSize: _cellToChildrenSize,
    cellToCenterChild: _cellToCenterChild,
    gridDisk: _gridDisk,
    gridDiskDistances: _gridDiskDistances,
    gridRingUnsafe: _gridRingUnsafe,
    gridDistance: _gridDistance,
    gridPathCells: _gridPathCells,
    compactCells: _compactCells,
    uncompactCells: _uncompactCells,
    areNeighborCells: _areNeighborCells,
    getNumCells: _getNumCells,
    getRes0Cells: _getRes0Cells,
    getPentagons: _getPentagons,
    greatCircleDistance: _greatCircleDistance,
    cellArea: _cellArea,
    getHexagonAreaAvg: _getHexagonAreaAvg,
    getHexagonEdgeLengthAvg: _getHexagonEdgeLengthAvg,
    h3IndexToSplitLong: _h3IndexToSplitLong,
    splitLongToH3Index: _splitLongToH3Index,
    degsToRads: _degsToRads,
    radsToDegs: _radsToDegs,
    UNITS: _UNITS,
} = _h3;

// ─── Re-exported types ────────────────────────────────────────────────────────

/** 64-bit hex string representation of an H3 index */
export type H3Index = string;

/** Pair of lower/upper 32-bit integers representing a 64-bit H3 index */
export type SplitLong = [number, number];

/** Lat/lng coordinate pair (degrees) */
export type CoordPair = [number, number];

/** Length/area unit constants */
export const UNITS = _UNITS;

// ─── Coordinate conversions ───────────────────────────────────────────────────

export const degsToRads = (deg: number): number => _degsToRads?.(deg) ?? 0;
export const radsToDegs = (rad: number): number => _radsToDegs?.(rad) ?? 0;

// ─── Split-long conversions ───────────────────────────────────────────────────

export const h3IndexToSplitLong = (h3Index: H3Index | SplitLong): SplitLong =>
    (_h3IndexToSplitLong?.(h3Index) as SplitLong) ?? [0, 0];

export const splitLongToH3Index = (lower: number, upper: number): H3Index =>
    _splitLongToH3Index?.(lower, upper) ?? '';

// ─── Cell indexing ─────────────────────────────────────────────────────────────

/**
 * Convert a lat/lng coordinate (degrees) to an H3 cell index.
 */
export const latLngToCell = (lat: number, lng: number, res: number): H3Index =>
    _latLngToCell?.(lat, lng, res) ?? '';

/**
 * Return the center lat/lng of an H3 cell as [lat, lng] in degrees.
 */
export const cellToLatLng = (h3Index: H3Index): CoordPair =>
    (_cellToLatLng?.(h3Index) as CoordPair) ?? [0, 0];

/**
 * Return the boundary vertices of an H3 cell as [[lat, lng], …] pairs.
 * Returns an empty array for invalid or empty cell indices.
 */
export const cellToBoundary = (
    h3Index: H3Index,
    formatAsGeoJson = false,
): CoordPair[] => {
    if (!h3Index || !(_isValidCell?.(h3Index) ?? false)) return [];
    return (_cellToBoundary?.(h3Index, formatAsGeoJson) as CoordPair[]) ?? [];
};

// ─── Cell validation ──────────────────────────────────────────────────────────

export const isValidCell = (h3Index: H3Index | SplitLong): boolean =>
    _isValidCell?.(h3Index) ?? false;

export const isValidIndex = (h3Index: H3Index | SplitLong): boolean =>
    _isValidIndex?.(h3Index) ?? false;

export const isPentagon = (h3Index: H3Index | SplitLong): boolean =>
    _isPentagon?.(h3Index) ?? false;

export const isResClassIII = (h3Index: H3Index | SplitLong): boolean =>
    _isResClassIII?.(h3Index) ?? false;

// ─── Cell properties ──────────────────────────────────────────────────────────

export const getResolution = (h3Index: H3Index | SplitLong): number =>
    _getResolution?.(h3Index) ?? 0;

export const getBaseCellNumber = (h3Index: H3Index | SplitLong): number =>
    _getBaseCellNumber?.(h3Index) ?? 0;

export const getIcosahedronFaces = (h3Index: H3Index | SplitLong): number[] =>
    (_getIcosahedronFaces?.(h3Index) as number[]) ?? [];

// ─── Cell hierarchy ────────────────────────────────────────────────────────────

export const cellToParent = (h3Index: H3Index, res: number): H3Index =>
    _cellToParent?.(h3Index, res) ?? '';

export const cellToChildren = (h3Index: H3Index, childRes: number): H3Index[] =>
    (_cellToChildren?.(h3Index, childRes) as H3Index[]) ?? [];

export const cellToChildrenSize = (h3Index: H3Index, childRes: number): number =>
    _cellToChildrenSize?.(h3Index, childRes) ?? 0;

export const cellToCenterChild = (h3Index: H3Index, childRes: number): H3Index =>
    _cellToCenterChild?.(h3Index, childRes) ?? '';

// ─── Grid traversal ───────────────────────────────────────────────────────────

/**
 * Return all cells within k grid rings of h3Index (inclusive).
 */
export const gridDisk = (h3Index: H3Index, k: number): H3Index[] =>
    (_gridDisk?.(h3Index, k) as H3Index[]) ?? [];

/**
 * Return cells within k grid rings grouped by ring distance.
 */
export const gridDiskDistances = (h3Index: H3Index, k: number): H3Index[][] =>
    (_gridDiskDistances?.(h3Index, k) as H3Index[][]) ?? [];

export const gridRingUnsafe = (h3Index: H3Index, k: number): H3Index[] =>
    (_gridRingUnsafe?.(h3Index, k) as H3Index[]) ?? [];

export const gridDistance = (origin: H3Index, dest: H3Index): number =>
    _gridDistance?.(origin, dest) ?? 0;

export const gridPathCells = (origin: H3Index, dest: H3Index): H3Index[] =>
    (_gridPathCells?.(origin, dest) as H3Index[]) ?? [];

// ─── Set operations ───────────────────────────────────────────────────────────

export const compactCells = (cells: H3Index[]): H3Index[] =>
    (_compactCells?.(cells) as H3Index[]) ?? [];

export const uncompactCells = (cells: H3Index[], res: number): H3Index[] =>
    (_uncompactCells?.(cells, res) as H3Index[]) ?? [];

export const areNeighborCells = (a: H3Index, b: H3Index): boolean =>
    _areNeighborCells?.(a, b) ?? false;

// ─── Global cell sets ─────────────────────────────────────────────────────────

export const getNumCells = (res: number): number => _getNumCells?.(res) ?? 0;
export const getRes0Cells = (): H3Index[] => (_getRes0Cells?.() as H3Index[]) ?? [];
export const getPentagons = (res: number): H3Index[] =>
    (_getPentagons?.(res) as H3Index[]) ?? [];

// ─── Half-resolution tile geometry ────────────────────────────────────────────

/** A single polygon produced by {@link cellToHalfResolutionTiles}. */
export type HalfResolutionTile = {
    /** `true` for the single center tile (the 1/2-scaled inner hex). */
    isCenter: boolean;
    /**
     * Polygon vertices.
     * - `formatAsGeoJson=false` (default): `[lat, lng]` pairs, ring is NOT closed.
     * - `formatAsGeoJson=true`: `[lng, lat]` pairs, ring IS closed (first vertex
     *   repeated at the end), matching the GeoJSON Polygon ring convention.
     */
    polygon: CoordPair[];
    /** The parent H3 cell at its integer resolution. */
    parentH3Index: H3Index;
};

/**
 * Split a parent hex cell into half-resolution tiles:
 *   - **1 center tile** – the parent hex boundary scaled to 1/2 around its
 *     centroid (the "solid" inner hexagon).
 *   - **6 petal tiles** – trapezoids that fill the remaining space between the
 *     1/2-scaled inner hex and each outer edge of the parent hex.  Each petal
 *     is bounded by two inner-hex vertices and the two corresponding outer-hex
 *     vertices, creating the visual "half" that faces the adjacent neighbour.
 *
 * In GeoJSON mode (`formatAsGeoJson=true`):
 *   - Coordinates are `[lng, lat]` instead of `[lat, lng]`.
 *   - Each polygon ring is closed (first vertex repeated at the end).
 *
 * Pentagon cells (5-sided) follow the same logic and produce 1 + 5 tiles.
 *
 * @param parentCell      A valid H3 cell at any integer resolution.
 * @param formatAsGeoJson Coordinate order and ring closure (default: `false`).
 * @returns Array of 7 tiles: index 0 = center, indices 1–6 = petals.
 *          Returns an empty array when the input is invalid or unavailable.
 */
export function cellToHalfResolutionTiles(
    parentCell: H3Index,
    formatAsGeoJson = false,
): HalfResolutionTile[] {
    if (!parentCell || !(_isValidCell?.(parentCell) ?? false)) return [];

    const [centerLat, centerLng] = cellToLatLng(parentCell);
    const outerVerts = cellToBoundary(parentCell, false); // [[lat, lng], …]
    if (outerVerts.length < 3) return [];

    const SCALE = 1 / 2;
    const innerVerts: CoordPair[] = outerVerts.map(
        ([lat, lng]) =>
            [
                centerLat + (lat - centerLat) * SCALE,
                centerLng + (lng - centerLng) * SCALE,
            ] as CoordPair,
    );

    /** Convert [lat, lng] verts to the requested format, closing the ring when needed. */
    const toRing = (verts: CoordPair[]): CoordPair[] => {
        if (formatAsGeoJson) {
            const ring: CoordPair[] = verts.map(([lat, lng]) => [lng, lat] as CoordPair);
            ring.push(ring[0]);
            return ring;
        }
        return verts;
    };

    const tiles: HalfResolutionTile[] = [];

    // Center tile: the 1/2-scaled inner hex
    tiles.push({
        isCenter: true,
        polygon: toRing(innerVerts),
        parentH3Index: parentCell,
    });

    // Petal tiles: one per outer edge of the parent hex
    const n = outerVerts.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        // Trapezoid: inner[i] → outer[i] → outer[j] → inner[j]
        const petal: CoordPair[] = [innerVerts[i], outerVerts[i], outerVerts[j], innerVerts[j]];
        tiles.push({
            isCenter: false,
            polygon: toRing(petal),
            parentH3Index: parentCell,
        });
    }

    return tiles;
}

// ─── Measurement ──────────────────────────────────────────────────────────────

export const greatCircleDistance = (
    a: CoordPair,
    b: CoordPair,
    unit: string,
): number => _greatCircleDistance?.(a, b, unit) ?? 0;

export const cellArea = (h3Index: H3Index, unit: string): number =>
    _cellArea?.(h3Index, unit) ?? 0;

export const getHexagonAreaAvg = (res: number, unit: string): number =>
    _getHexagonAreaAvg?.(res, unit) ?? 0;

export const getHexagonEdgeLengthAvg = (res: number, unit: string): number =>
    _getHexagonEdgeLengthAvg?.(res, unit) ?? 0;
