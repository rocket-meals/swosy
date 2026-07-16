/**
 * Snaps a recorded GPS track onto the real-world road/path network (true map
 * matching), as opposed to `RouteSmootherHelper.snapToRoad` which only smooths
 * the track against its *own* shape. Uses the same PBF vector-tile
 * infrastructure as `TileFeatureHelper.ts` (no MapLibre map instance or
 * backend routing service required) to fetch nearby road/path line geometry,
 * then projects each GPS point onto the closest such line.
 */

import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

import { resolveTileUrl, getTilesForBounds, calculateOptimalZoom, DEFAULT_STYLE_URL } from './TileFeatureHelper';
import type { LatLngBounds } from './TileFeatureHelper';
import { squaredDistDeg, projectOntoSegment } from './RouteSmootherHelper';

// ─── Road-segment extraction ────────────────────────────────────────────────

/** OpenMapTiles source-layer that contains road/path/track line geometry. */
const TRANSPORTATION_LAYER = 'transportation';

/** VectorTileFeature.type value for LineString/MultiLineString geometries. */
const GEOMETRY_TYPE_LINE = 2;

export type RoadSegment = {
	a: [number, number]; // [lng, lat]
	b: [number, number]; // [lng, lat]
};

/** Cache: `"tileUrlTemplate|z|x|y"` → parsed road segments for that tile. */
const roadSegmentTileCache: Record<string, RoadSegment[]> = {};

async function fetchRoadSegmentsForTile(
	tileUrlTemplate: string,
	z: number,
	x: number,
	y: number,
): Promise<RoadSegment[]> {
	const cacheKey = `${tileUrlTemplate}|${z}|${x}|${y}`;
	const cached = roadSegmentTileCache[cacheKey];
	if (cached) return cached;

	const url = tileUrlTemplate.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
	const res = await fetch(url);
	if (!res.ok) {
		roadSegmentTileCache[cacheKey] = [];
		return [];
	}

	const buffer = await res.arrayBuffer();
	const tile = new VectorTile(new Pbf(buffer));
	const layer = tile.layers[TRANSPORTATION_LAYER];
	const segments: RoadSegment[] = [];

	if (layer) {
		for (let i = 0; i < layer.length; i++) {
			const feat = layer.feature(i);
			if (feat.type !== GEOMETRY_TYPE_LINE) continue;

			const geometry = feat.toGeoJSON(x, y, z).geometry;
			const lines: [number, number][][] =
				geometry.type === 'MultiLineString' ? geometry.coordinates
					: geometry.type === 'LineString' ? [geometry.coordinates]
					: [];

			for (const line of lines) {
				for (let j = 0; j < line.length - 1; j++) {
					segments.push({ a: line[j], b: line[j + 1] });
				}
			}
		}
	}

	roadSegmentTileCache[cacheKey] = segments;
	return segments;
}

/**
 * Fetch all road/path segments covering the given bounding box.
 * Zoom is picked automatically (same budget as `TileFeatureHelper.calculateOptimalZoom`)
 * to keep the number of tile downloads manageable for larger activities.
 */
export async function fetchRoadSegmentsForBounds(
	bounds: LatLngBounds,
	styleUrl: string = DEFAULT_STYLE_URL,
): Promise<RoadSegment[]> {
	const zoom = calculateOptimalZoom(bounds.minLat, bounds.minLng, bounds.maxLat, bounds.maxLng);
	const tileUrlTemplate = await resolveTileUrl(styleUrl);
	const tiles = getTilesForBounds(bounds.minLat, bounds.minLng, bounds.maxLat, bounds.maxLng, zoom);

	const results = await Promise.all(tiles.map((t) => fetchRoadSegmentsForTile(tileUrlTemplate, t.z, t.x, t.y)));
	return results.flat();
}

// ─── Point-to-road matching ─────────────────────────────────────────────────

/** Side length of one spatial-grid bucket, in degrees (≈100m at mid-latitudes). */
const GRID_CELL_SIZE_DEG = 0.001;

/** Default maximum distance a GPS point may snap to a road/path before it's left unmatched. */
export const DEFAULT_MAX_SNAP_DISTANCE_METERS = 30;

/** Rough meters-per-degree-latitude conversion; good enough for a snap-distance cutoff. */
function metersToDeg(meters: number): number {
	return meters / 111_320;
}

function gridCell(lng: number, lat: number): [number, number] {
	return [Math.floor(lng / GRID_CELL_SIZE_DEG), Math.floor(lat / GRID_CELL_SIZE_DEG)];
}

/** Buckets segments by every grid cell their bounding box touches, for fast nearby lookups. */
function buildSegmentGrid(segments: RoadSegment[]): Map<string, RoadSegment[]> {
	const grid = new Map<string, RoadSegment[]>();
	for (const seg of segments) {
		const [xMin, yMin] = gridCell(Math.min(seg.a[0], seg.b[0]), Math.min(seg.a[1], seg.b[1]));
		const [xMax, yMax] = gridCell(Math.max(seg.a[0], seg.b[0]), Math.max(seg.a[1], seg.b[1]));
		for (let x = xMin; x <= xMax; x++) {
			for (let y = yMin; y <= yMax; y++) {
				const key = `${x},${y}`;
				const bucket = grid.get(key);
				if (bucket) bucket.push(seg);
				else grid.set(key, [seg]);
			}
		}
	}
	return grid;
}

/**
 * Projects each point onto the nearest road/path segment within `maxSnapDistanceMeters`.
 * Points with no segment close enough are returned unchanged, so the resulting line stays
 * continuous even where the road/path network has gaps or isn't mapped (e.g. off-trail).
 */
export function matchPointsToRoads(
	points: [number, number][],
	segments: RoadSegment[],
	maxSnapDistanceMeters: number = DEFAULT_MAX_SNAP_DISTANCE_METERS,
): [number, number][] {
	if (segments.length === 0 || points.length === 0) return points;

	const grid = buildSegmentGrid(segments);
	const maxDistDeg = metersToDeg(maxSnapDistanceMeters);
	const maxDistDegSq = maxDistDeg * maxDistDeg;

	return points.map((pt) => {
		const [cellX, cellY] = gridCell(pt[0], pt[1]);
		let bestDistSq = Infinity;
		let bestPt: [number, number] | null = null;

		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				const bucket = grid.get(`${cellX + dx},${cellY + dy}`);
				if (!bucket) continue;
				for (const seg of bucket) {
					const proj = projectOntoSegment(pt, seg.a, seg.b);
					const d = squaredDistDeg(pt, proj);
					if (d < bestDistSq) {
						bestDistSq = d;
						bestPt = proj;
					}
				}
			}
		}

		return bestPt && bestDistSq <= maxDistDegSq ? bestPt : pt;
	});
}
