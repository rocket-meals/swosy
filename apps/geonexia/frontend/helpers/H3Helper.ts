/*
 * H3Helper.ts – Wrapper around the h3-js v4.4.0 library bundled locally.
 *
 * The h3-js npm package (which uses emscripten/asm.js) caused issues when
 * bundled via Metro because Metro applies the package.json "browser" field
 * which selects a WASM-based build incompatible with Hermes. This file imports
 * the pre-built asm.js dist directly from a local path, bypassing Metro's
 * conditional-exports resolution entirely.
 *
 * Based on the H3 library by Uber Technologies, Inc.
 * Licensed under the Apache License, Version 2.0
 * https://github.com/uber/h3
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
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
} = require('./h3/libh3') as typeof import('./h3/libh3');

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

export const degsToRads = (deg: number): number => _degsToRads(deg);
export const radsToDegs = (rad: number): number => _radsToDegs(rad);

// ─── Split-long conversions ───────────────────────────────────────────────────

export const h3IndexToSplitLong = (h3Index: H3Index | SplitLong): SplitLong =>
    _h3IndexToSplitLong(h3Index) as SplitLong;

export const splitLongToH3Index = (lower: number, upper: number): H3Index =>
    _splitLongToH3Index(lower, upper);

// ─── Cell indexing ─────────────────────────────────────────────────────────────

/**
 * Convert a lat/lng coordinate (degrees) to an H3 cell index.
 */
export const latLngToCell = (lat: number, lng: number, res: number): H3Index =>
    _latLngToCell(lat, lng, res);

/**
 * Return the center lat/lng of an H3 cell as [lat, lng] in degrees.
 */
export const cellToLatLng = (h3Index: H3Index): CoordPair =>
    _cellToLatLng(h3Index) as CoordPair;

/**
 * Return the boundary vertices of an H3 cell as [[lat, lng], …] pairs.
 */
export const cellToBoundary = (
    h3Index: H3Index,
    formatAsGeoJson = false,
): CoordPair[] => _cellToBoundary(h3Index, formatAsGeoJson) as CoordPair[];

// ─── Cell validation ──────────────────────────────────────────────────────────

export const isValidCell = (h3Index: H3Index | SplitLong): boolean =>
    _isValidCell(h3Index);

export const isValidIndex = (h3Index: H3Index | SplitLong): boolean =>
    _isValidIndex(h3Index);

export const isPentagon = (h3Index: H3Index | SplitLong): boolean =>
    _isPentagon(h3Index);

export const isResClassIII = (h3Index: H3Index | SplitLong): boolean =>
    _isResClassIII(h3Index);

// ─── Cell properties ──────────────────────────────────────────────────────────

export const getResolution = (h3Index: H3Index | SplitLong): number =>
    _getResolution(h3Index);

export const getBaseCellNumber = (h3Index: H3Index | SplitLong): number =>
    _getBaseCellNumber(h3Index);

export const getIcosahedronFaces = (h3Index: H3Index | SplitLong): number[] =>
    _getIcosahedronFaces(h3Index) as number[];

// ─── Cell hierarchy ────────────────────────────────────────────────────────────

export const cellToParent = (h3Index: H3Index, res: number): H3Index =>
    _cellToParent(h3Index, res);

export const cellToChildren = (h3Index: H3Index, childRes: number): H3Index[] =>
    _cellToChildren(h3Index, childRes) as H3Index[];

export const cellToChildrenSize = (h3Index: H3Index, childRes: number): number =>
    _cellToChildrenSize(h3Index, childRes);

export const cellToCenterChild = (h3Index: H3Index, childRes: number): H3Index =>
    _cellToCenterChild(h3Index, childRes);

// ─── Grid traversal ───────────────────────────────────────────────────────────

/**
 * Return all cells within k grid rings of h3Index (inclusive).
 */
export const gridDisk = (h3Index: H3Index, k: number): H3Index[] =>
    _gridDisk(h3Index, k) as H3Index[];

/**
 * Return cells within k grid rings grouped by ring distance.
 */
export const gridDiskDistances = (h3Index: H3Index, k: number): H3Index[][] =>
    _gridDiskDistances(h3Index, k) as H3Index[][];

export const gridRingUnsafe = (h3Index: H3Index, k: number): H3Index[] =>
    _gridRingUnsafe(h3Index, k) as H3Index[];

export const gridDistance = (origin: H3Index, dest: H3Index): number =>
    _gridDistance(origin, dest);

export const gridPathCells = (origin: H3Index, dest: H3Index): H3Index[] =>
    _gridPathCells(origin, dest) as H3Index[];

// ─── Set operations ───────────────────────────────────────────────────────────

export const compactCells = (cells: H3Index[]): H3Index[] =>
    _compactCells(cells) as H3Index[];

export const uncompactCells = (cells: H3Index[], res: number): H3Index[] =>
    _uncompactCells(cells, res) as H3Index[];

export const areNeighborCells = (a: H3Index, b: H3Index): boolean =>
    _areNeighborCells(a, b);

// ─── Global cell sets ─────────────────────────────────────────────────────────

export const getNumCells = (res: number): number => _getNumCells(res);
export const getRes0Cells = (): H3Index[] => _getRes0Cells() as H3Index[];
export const getPentagons = (res: number): H3Index[] =>
    _getPentagons(res) as H3Index[];

// ─── Measurement ──────────────────────────────────────────────────────────────

export const greatCircleDistance = (
    a: CoordPair,
    b: CoordPair,
    unit: string,
): number => _greatCircleDistance(a, b, unit);

export const cellArea = (h3Index: H3Index, unit: string): number =>
    _cellArea(h3Index, unit);

export const getHexagonAreaAvg = (res: number, unit: string): number =>
    _getHexagonAreaAvg(res, unit);

export const getHexagonEdgeLengthAvg = (res: number, unit: string): number =>
    _getHexagonEdgeLengthAvg(res, unit);
