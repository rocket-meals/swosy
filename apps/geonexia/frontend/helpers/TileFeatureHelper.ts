/**
 * Helper for fetching vector-tile features directly from the tiling server
 * **without** requiring a MapLibre map instance.
 *
 * Accepts a bounding box (minLat, minLng, maxLat, maxLng) and a zoom level,
 * computes the set of vector tiles that cover the area, downloads the PBF
 * data via HTTP, parses it with the Mapbox-Vector-Tile library and returns
 * features in the same `MapFeatureInfo` format that the map-based
 * `queryRenderedFeatures` approach uses.
 */

import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

import type { MapFeatureInfo } from './RouteNameSuggestionHelper';

// ─── Configuration ──────────────────────────────────────────────────────────

/** Default style URL whose `sources` block contains the PBF tile URL template. */
const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * Layers to skip when extracting features (overlay / UI layers that are not
 * real geographic features).
 */
const SKIP_LAYERS = new Set<string>([
	'housenumber',
]);

// ─── Tile-coordinate helpers ────────────────────────────────────────────────

/** Convert longitude to tile X at the given zoom level. */
function lngToTileX(lng: number, zoom: number): number {
	return Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
}

/** Convert latitude to tile Y at the given zoom level. */
function latToTileY(lat: number, zoom: number): number {
	const latRad = (lat * Math.PI) / 180;
	return Math.floor(
		((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
			Math.pow(2, zoom),
	);
}

/** Return all (z, x, y) tile coordinates that cover the given bounding box. */
export function getTilesForBounds(
	minLat: number,
	minLng: number,
	maxLat: number,
	maxLng: number,
	zoom: number,
): Array<{ z: number; x: number; y: number }> {
	const xMin = lngToTileX(minLng, zoom);
	const xMax = lngToTileX(maxLng, zoom);
	// Note: tile Y is inverted – smaller lat → larger Y.
	const yMin = latToTileY(maxLat, zoom);
	const yMax = latToTileY(minLat, zoom);

	const tiles: Array<{ z: number; x: number; y: number }> = [];
	for (let x = xMin; x <= xMax; x++) {
		for (let y = yMin; y <= yMax; y++) {
			tiles.push({ z: zoom, x, y });
		}
	}
	return tiles;
}

// ─── Style / tile-URL resolution ────────────────────────────────────────────

/** Cache: style URL → resolved tile URL template. */
const tileUrlCache: Record<string, string> = {};

/**
 * Fetch the MapLibre style JSON and extract the first `{z}/{x}/{y}` PBF tile
 * URL template from the `sources` section.
 */
export async function resolveTileUrl(styleUrl: string = DEFAULT_STYLE_URL): Promise<string> {
	const cached = tileUrlCache[styleUrl];
	if (cached) return cached;

	const res = await fetch(styleUrl);
	if (!res.ok) throw new Error(`Failed to fetch style: ${res.status}`);
	const style = await res.json();

	// Walk all sources looking for a `tiles` array containing a PBF URL.
	for (const src of Object.values(style.sources ?? {})) {
		const source = src as Record<string, unknown>;
		const tiles = source.tiles as string[] | undefined;
		if (tiles) {
			for (const url of tiles) {
				if (url.includes('{z}') || url.includes('.pbf')) {
					tileUrlCache[styleUrl] = url;
					return url;
				}
			}
		}

		// Some styles use a TileJSON URL in the `url` field instead.
		if (typeof source.url === 'string') {
			try {
				const tjRes = await fetch(source.url);
				if (tjRes.ok) {
					const tj = await tjRes.json();
					const tjTiles = tj.tiles as string[] | undefined;
					if (tjTiles) {
						for (const url of tjTiles) {
							if (url.includes('{z}') || url.includes('.pbf')) {
								tileUrlCache[styleUrl] = url;
								return url;
							}
						}
					}
				}
			} catch {
				// Ignore TileJSON fetch errors and continue.
			}
		}
	}

	throw new Error('Could not find a PBF tile URL template in the style JSON.');
}

// ─── Single-tile fetching & parsing ─────────────────────────────────────────

/**
 * Fetch a single vector tile and parse it into an array of `MapFeatureInfo`.
 *
 * @param tileUrlTemplate – URL template with `{z}`, `{x}`, `{y}` placeholders.
 * @param z – Zoom level.
 * @param x – Tile X coordinate.
 * @param y – Tile Y coordinate.
 */
export async function fetchAndParseTile(
	tileUrlTemplate: string,
	z: number,
	x: number,
	y: number,
): Promise<MapFeatureInfo[]> {
	const url = tileUrlTemplate
		.replace('{z}', String(z))
		.replace('{x}', String(x))
		.replace('{y}', String(y));

	const res = await fetch(url);
	if (!res.ok) {
		// Tiles may legitimately return 404 for ocean / empty areas.
		if (res.status === 404) return [];
		throw new Error(`Tile fetch failed (${res.status}): ${url}`);
	}

	const buffer = await res.arrayBuffer();
	const tile = new VectorTile(new Pbf(buffer));

	const features: MapFeatureInfo[] = [];
	const seen = new Set<string>();

	for (const layerName of Object.keys(tile.layers)) {
		if (SKIP_LAYERS.has(layerName)) continue;

		const layer = tile.layers[layerName];
		for (let i = 0; i < layer.length; i++) {
			const feat = layer.feature(i);
			const props = feat.properties ?? {};

			const name = (props.name as string) || (props['name:de'] as string) || null;
			const cls = (props['class'] as string) || null;
			const subclass = (props.subclass as string) || null;
			const highway = (props.highway as string) || null;
			const waterway = (props.waterway as string) || null;
			const building = (props.building as string) || null;
			const natural = (props.natural as string) || null;
			const landuse = (props.landuse as string) || null;
			const amenity = (props.amenity as string) || null;

			// Deduplicate within a tile (same approach as hexTileScript.ts).
			const key =
				(name ?? '') + '|' + (cls ?? '') + '|' + (subclass ?? '') + '|' +
				(highway ?? '') + '|' + (waterway ?? '') + '|' +
				(building ?? '') + '|' + (natural ?? '') + '|' + (landuse ?? '') + '|' +
				(amenity ?? '') + '|' + layerName;

			if (seen.has(key)) continue;
			seen.add(key);

			features.push({
				layerId: layerName,
				name,
				class: cls,
				subclass,
				highway,
				waterway,
				building,
				natural,
				landuse,
				amenity,
			});
		}
	}

	return features;
}

// ─── Main public API ────────────────────────────────────────────────────────

export type TileFeatureQueryParams = {
	/** Southern boundary latitude. */
	minLat: number;
	/** Western boundary longitude. */
	minLng: number;
	/** Northern boundary latitude. */
	maxLat: number;
	/** Eastern boundary longitude. */
	maxLng: number;
	/** Zoom level (typically 14 for street-level detail). */
	zoom: number;
	/** Optional style URL override (default: OpenFreeMap Liberty). */
	styleUrl?: string;
};

/**
 * Fetch all vector-tile features that fall within the given bounding box at
 * the specified zoom level.  Returns a flat array of `MapFeatureInfo`.
 *
 * This function does **not** require a MapLibre map instance.  It downloads
 * raw PBF tiles over HTTP and parses them in-process.
 */
export async function queryTileFeaturesForBounds(
	params: TileFeatureQueryParams,
): Promise<MapFeatureInfo[]> {
	const { minLat, minLng, maxLat, maxLng, zoom, styleUrl } = params;

	const tileUrlTemplate = await resolveTileUrl(styleUrl);
	const tiles = getTilesForBounds(minLat, minLng, maxLat, maxLng, zoom);

	const results = await Promise.all(
		tiles.map((t) => fetchAndParseTile(tileUrlTemplate, t.z, t.x, t.y)),
	);

	return results.flat();
}

/**
 * Convenience wrapper that returns features grouped by a synthetic tile key
 * (`"z/x/y"`), matching the `Record<string, MapFeatureInfo[]>` shape expected
 * by `buildAreaInfoDict`.
 */
export async function queryTileFeaturesGrouped(
	params: TileFeatureQueryParams,
): Promise<Record<string, MapFeatureInfo[]>> {
	const { minLat, minLng, maxLat, maxLng, zoom, styleUrl } = params;

	const tileUrlTemplate = await resolveTileUrl(styleUrl);
	const tiles = getTilesForBounds(minLat, minLng, maxLat, maxLng, zoom);

	const grouped: Record<string, MapFeatureInfo[]> = {};

	await Promise.all(
		tiles.map(async (t) => {
			const features = await fetchAndParseTile(tileUrlTemplate, t.z, t.x, t.y);
			grouped[`${t.z}/${t.x}/${t.y}`] = features;
		}),
	);

	return grouped;
}
