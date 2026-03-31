/*
 * Type declarations for the bundled h3-js v4.4.0 distribution file.
 * This declaration file mirrors the public API of the h3-js package.
 * See https://h3geo.org/docs/api/indexing for full documentation.
 */

export type H3Index = string;
export type SplitLong = [number, number];
export type CoordPair = [number, number];

export const UNITS: {
    m: 'm';
    m2: 'm2';
    km: 'km';
    km2: 'km2';
    rads: 'rads';
    rads2: 'rads2';
};

export function degsToRads(deg: number): number;
export function radsToDegs(rad: number): number;

export function h3IndexToSplitLong(h3Index: H3Index | SplitLong): SplitLong;
export function splitLongToH3Index(lower: number, upper: number): H3Index;

export function latLngToCell(lat: number, lng: number, res: number): H3Index;
export function cellToLatLng(h3Index: H3Index): CoordPair;
export function cellToBoundary(h3Index: H3Index, formatAsGeoJson?: boolean): CoordPair[];

export function isValidCell(h3Index: H3Index | SplitLong): boolean;
export function isValidIndex(h3Index: H3Index | SplitLong): boolean;
export function isPentagon(h3Index: H3Index | SplitLong): boolean;
export function isResClassIII(h3Index: H3Index | SplitLong): boolean;

export function getResolution(h3Index: H3Index | SplitLong): number;
export function getBaseCellNumber(h3Index: H3Index | SplitLong): number;
export function getIcosahedronFaces(h3Index: H3Index | SplitLong): number[];

export function cellToParent(h3Index: H3Index, res: number): H3Index;
export function cellToChildren(h3Index: H3Index, childRes: number): H3Index[];
export function cellToChildrenSize(h3Index: H3Index, childRes: number): number;
export function cellToCenterChild(h3Index: H3Index, childRes: number): H3Index;

export function gridDisk(h3Index: H3Index, k: number): H3Index[];
export function gridDiskDistances(h3Index: H3Index, k: number): H3Index[][];
export function gridRingUnsafe(h3Index: H3Index, k: number): H3Index[];
export function gridDistance(origin: H3Index, dest: H3Index): number;
export function gridPathCells(origin: H3Index, dest: H3Index): H3Index[];

export function compactCells(cells: H3Index[]): H3Index[];
export function uncompactCells(cells: H3Index[], res: number): H3Index[];
export function areNeighborCells(a: H3Index, b: H3Index): boolean;

export function getNumCells(res: number): number;
export function getRes0Cells(): H3Index[];
export function getPentagons(res: number): H3Index[];

export function polygonToCells(coordinates: CoordPair[][] | CoordPair[][][], res: number, isGeoJson?: boolean): H3Index[];
export function cellsToMultiPolygon(h3Indexes: H3Index[], formatAsGeoJson?: boolean): CoordPair[][][];

export function greatCircleDistance(a: CoordPair, b: CoordPair, unit: string): number;
export function cellArea(h3Index: H3Index, unit: string): number;
export function getHexagonAreaAvg(res: number, unit: string): number;
export function getHexagonEdgeLengthAvg(res: number, unit: string): number;
