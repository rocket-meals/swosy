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
    polygonToCells: _polygonToCells,
    cellsToMultiPolygon: _cellsToMultiPolygon,
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

export const polygonToCells = (
    coordinates: CoordPair[][] | CoordPair[][][],
    res: number,
    isGeoJson = false,
): H3Index[] =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_polygonToCells?.(coordinates as any, res, isGeoJson) as H3Index[]) ?? [];

export const cellsToMultiPolygon = (
    h3Indexes: H3Index[],
    formatAsGeoJson = false,
): CoordPair[][][] =>
    (_cellsToMultiPolygon?.(h3Indexes, formatAsGeoJson) as CoordPair[][][]) ?? [];

// ─── Global cell sets ─────────────────────────────────────────────────────────

export const getNumCells = (res: number): number => _getNumCells?.(res) ?? 0;
export const getRes0Cells = (): H3Index[] => (_getRes0Cells?.() as H3Index[]) ?? [];
export const getPentagons = (res: number): H3Index[] =>
    (_getPentagons?.(res) as H3Index[]) ?? [];

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

// ─── Route distance ───────────────────────────────────────────────────────────

function _haversineKm(a: CoordPair, b: CoordPair): number {
    const R = 6371;
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLng = ((b[1] - a[1]) * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Format a kilometre distance for display.  Values ≥ 1 km are shown with two
 * decimal places (e.g. "1.23 km"); shorter distances are shown in metres
 * (e.g. "450 m").  Returns "—" for zero or negative values.
 */
export function formatDistanceKm(km: number): string {
    if (km <= 0) return '—';
    if (km >= 1) return `${km.toFixed(2)} km`;
    return `${Math.round(km * 1000)} m`;
}

/**
 * Sum haversine distances between consecutive cell centers to get total route
 * length in kilometres.  Returns 0 when the H3 library is unavailable or the
 * cell list has fewer than 2 entries.
 */
export function computeRouteLengthKm(orderedCells: H3Index[]): number {
    if (orderedCells.length < 2 || !isAvailable()) return 0;
    let totalKm = 0;
    for (let i = 1; i < orderedCells.length; i++) {
        try {
            const a = cellToLatLng(orderedCells[i - 1]);
            const b = cellToLatLng(orderedCells[i]);
            totalKm += _haversineKm(a, b);
        } catch {
            // skip invalid cells
        }
    }
    return totalKm;
}
