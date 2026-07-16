/**
 * Snaps a recorded GPS track onto the real-world road/path network (true map
 * matching), as opposed to `RouteSmootherHelper.snapToRoad` which only smooths
 * the track against its *own* shape. Uses the same PBF vector-tile
 * infrastructure as `TileFeatureHelper.ts` (no MapLibre map instance or
 * backend routing service required) to fetch nearby road/path line geometry.
 *
 * Unlike a naive "snap each point to its nearest road independently" approach,
 * `matchRouteToRoads` tries to figure out *which* road/path was walked along:
 * consecutive GPS points that land on the same way are connected using that
 * way's own vertices (so the line follows the road's actual shape instead of
 * cutting a straight line between two independently-snapped points), and an
 * isolated point that lands on a different, nearby parallel way than both its
 * neighbours is treated as GPS noise and pulled back onto the neighbours' way.
 */

import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

import { resolveTileUrl, getTilesForBounds, calculateOptimalZoom, DEFAULT_STYLE_URL } from './TileFeatureHelper';
import type { LatLngBounds } from './TileFeatureHelper';
import { squaredDistDeg, projectOntoSegmentWithT } from './RouteSmootherHelper';

// ─── Road-way extraction ────────────────────────────────────────────────────

/** OpenMapTiles source-layer that contains road/path/track line geometry. */
const TRANSPORTATION_LAYER = 'transportation';

/** VectorTileFeature.type value for LineString/MultiLineString geometries. */
const GEOMETRY_TYPE_LINE = 2;

/** One road/path polyline, in walking order along the way. */
export type RoadWay = {
	points: [number, number][]; // [lng, lat]
};

/** Cache: `"tileUrlTemplate|z|x|y"` → parsed road ways for that tile. */
const roadWayTileCache: Record<string, RoadWay[]> = {};

async function fetchRoadWaysForTile(
	tileUrlTemplate: string,
	z: number,
	x: number,
	y: number,
): Promise<RoadWay[]> {
	const cacheKey = `${tileUrlTemplate}|${z}|${x}|${y}`;
	const cached = roadWayTileCache[cacheKey];
	if (cached) return cached;

	const url = tileUrlTemplate.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
	const res = await fetch(url);
	if (!res.ok) {
		roadWayTileCache[cacheKey] = [];
		return [];
	}

	const buffer = await res.arrayBuffer();
	const tile = new VectorTile(new Pbf(buffer));
	const layer = tile.layers[TRANSPORTATION_LAYER];
	const ways: RoadWay[] = [];

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
				if (line.length >= 2) ways.push({ points: line });
			}
		}
	}

	roadWayTileCache[cacheKey] = ways;
	return ways;
}

/**
 * Fetch all road/path ways covering the given bounding box.
 * Zoom is picked automatically (same budget as `TileFeatureHelper.calculateOptimalZoom`)
 * to keep the number of tile downloads manageable for larger activities.
 *
 * Note: ways that cross a tile boundary are returned as separate fragments (one
 * per tile), since vector tiles clip geometry at tile edges. Continuity matching
 * (see `matchRouteToRoads`) therefore only "sees" the same way within one tile.
 */
export async function fetchRoadWaysForBounds(
	bounds: LatLngBounds,
	styleUrl: string = DEFAULT_STYLE_URL,
): Promise<RoadWay[]> {
	const zoom = calculateOptimalZoom(bounds.minLat, bounds.minLng, bounds.maxLat, bounds.maxLng);
	const tileUrlTemplate = await resolveTileUrl(styleUrl);
	const tiles = getTilesForBounds(bounds.minLat, bounds.minLng, bounds.maxLat, bounds.maxLng, zoom);

	const results = await Promise.all(tiles.map((t) => fetchRoadWaysForTile(tileUrlTemplate, t.z, t.x, t.y)));
	return results.flat();
}

// ─── Point-to-way matching ──────────────────────────────────────────────────

/** Side length of one spatial-grid bucket, in degrees (≈100m at mid-latitudes). */
const GRID_CELL_SIZE_DEG = 0.001;

/** Default maximum distance a GPS point may snap to a road/path before it's left unmatched. */
export const DEFAULT_MAX_SNAP_DISTANCE_METERS = 30;

/**
 * Typical smartphone GPS accuracy. Used for the "isolated point on a parallel
 * way" correction below: only a discrepancy within this range is assumed to be
 * measurement noise rather than an actual, deliberate way change.
 */
export const GPS_NOISE_THRESHOLD_METERS = 20;

/** Rough meters-per-degree-latitude conversion; good enough for a snap-distance cutoff. */
function metersToDeg(meters: number): number {
	return meters / 111_320;
}

function gridCell(lng: number, lat: number): [number, number] {
	return [Math.floor(lng / GRID_CELL_SIZE_DEG), Math.floor(lat / GRID_CELL_SIZE_DEG)];
}

type RoadSegmentRef = {
	wayIndex: number;
	/** `points[segIndex]` → `points[segIndex + 1]` within `ways[wayIndex]`. */
	segIndex: number;
	a: [number, number];
	b: [number, number];
};

/** Buckets way segments by every grid cell their bounding box touches, for fast nearby lookups. */
function buildSegmentGrid(ways: RoadWay[]): Map<string, RoadSegmentRef[]> {
	const grid = new Map<string, RoadSegmentRef[]>();
	ways.forEach((way, wayIndex) => {
		for (let segIndex = 0; segIndex < way.points.length - 1; segIndex++) {
			const a = way.points[segIndex];
			const b = way.points[segIndex + 1];
			const ref: RoadSegmentRef = { wayIndex, segIndex, a, b };
			const [xMin, yMin] = gridCell(Math.min(a[0], b[0]), Math.min(a[1], b[1]));
			const [xMax, yMax] = gridCell(Math.max(a[0], b[0]), Math.max(a[1], b[1]));
			for (let x = xMin; x <= xMax; x++) {
				for (let y = yMin; y <= yMax; y++) {
					const key = `${x},${y}`;
					const bucket = grid.get(key);
					if (bucket) bucket.push(ref);
					else grid.set(key, [ref]);
				}
			}
		}
	});
	return grid;
}

type PointMatch = {
	wayIndex: number;
	segIndex: number;
	point: [number, number];
	/** Position of `point` along the segment, 0 = at `a`, 1 = at `b`. */
	t: number;
	distSq: number;
};

/** Finds the nearest way (from the grid's 3×3 neighbourhood) within `maxDistDegSq`. */
function findBestMatch(
	pt: [number, number],
	grid: Map<string, RoadSegmentRef[]>,
	maxDistDegSq: number,
): PointMatch | null {
	const [cellX, cellY] = gridCell(pt[0], pt[1]);
	let best: PointMatch | null = null;

	for (let dx = -1; dx <= 1; dx++) {
		for (let dy = -1; dy <= 1; dy++) {
			const bucket = grid.get(`${cellX + dx},${cellY + dy}`);
			if (!bucket) continue;
			for (const seg of bucket) {
				const { point, t } = projectOntoSegmentWithT(pt, seg.a, seg.b);
				const distSq = squaredDistDeg(pt, point);
				if (!best || distSq < best.distSq) {
					best = { wayIndex: seg.wayIndex, segIndex: seg.segIndex, point, t, distSq };
				}
			}
		}
	}

	return best && best.distSq <= maxDistDegSq ? best : null;
}

/** Finds the nearest point on one specific way, ignoring all other ways. */
function findBestMatchOnWay(pt: [number, number], way: RoadWay, wayIndex: number, maxDistDegSq: number): PointMatch | null {
	let best: PointMatch | null = null;
	for (let segIndex = 0; segIndex < way.points.length - 1; segIndex++) {
		const { point, t } = projectOntoSegmentWithT(pt, way.points[segIndex], way.points[segIndex + 1]);
		const distSq = squaredDistDeg(pt, point);
		if (!best || distSq < best.distSq) {
			best = { wayIndex, segIndex, point, t, distSq };
		}
	}
	return best && best.distSq <= maxDistDegSq ? best : null;
}

/** Appends `pt` unless it's identical to the last point already in `path`. */
function pushDistinct(path: [number, number][], pt: [number, number]): void {
	const last = path[path.length - 1];
	if (!last || last[0] !== pt[0] || last[1] !== pt[1]) path.push(pt);
}

/**
 * Matches a raw GPS track onto the given road/path ways and returns the
 * resulting line.
 *
 * - Each point is snapped to its nearest way within `maxSnapDistanceMeters`;
 *   points with nothing close enough keep their original position, so the
 *   line stays continuous even where the road/path network has gaps.
 * - An isolated point matched to a different way than both its immediate
 *   neighbours (e.g. it landed on a parallel road) is re-matched onto the
 *   neighbours' way when it's still within `GPS_NOISE_THRESHOLD_METERS` of it -
 *   this is assumed to be measurement noise rather than a real detour.
 * - Consecutive points matched to the *same* way are connected using that
 *   way's own vertices between the two projections, instead of a straight cut,
 *   so the line follows the road/path shape that was actually walked. Points
 *   matched to different ways (junctions, road changes) are still connected
 *   directly, since no route graph search across ways is performed.
 */
export function matchRouteToRoads(
	points: [number, number][],
	ways: RoadWay[],
	maxSnapDistanceMeters: number = DEFAULT_MAX_SNAP_DISTANCE_METERS,
): [number, number][] {
	if (ways.length === 0 || points.length === 0) return points;

	const grid = buildSegmentGrid(ways);
	const maxDistDegSq = metersToDeg(maxSnapDistanceMeters) ** 2;
	const noiseDegSq = metersToDeg(GPS_NOISE_THRESHOLD_METERS) ** 2;

	const matches: (PointMatch | null)[] = points.map((pt) => findBestMatch(pt, grid, maxDistDegSq));

	// Isolated-point correction: point i differs from both neighbours, which
	// agree with each other - and point i is close enough to the neighbours'
	// way to plausibly be a noisy reading of the same way, not a real detour.
	for (let i = 1; i < matches.length - 1; i++) {
		const prev = matches[i - 1];
		const next = matches[i + 1];
		if (!prev || !next || prev.wayIndex !== next.wayIndex) continue;
		const curr = matches[i];
		if (curr && curr.wayIndex === prev.wayIndex) continue;

		const alt = findBestMatchOnWay(points[i], ways[prev.wayIndex], prev.wayIndex, noiseDegSq);
		if (alt) matches[i] = alt;
	}

	const result: [number, number][] = [];
	pushDistinct(result, matches[0] ? matches[0].point : points[0]);

	for (let i = 1; i < points.length; i++) {
		const prevMatch = matches[i - 1];
		const currMatch = matches[i];

		if (prevMatch && currMatch && prevMatch.wayIndex === currMatch.wayIndex) {
			// Follow the way's own vertices between the two projections instead of
			// cutting a straight line, in whichever direction the walk went.
			const wayPoints = ways[prevMatch.wayIndex].points;
			const fromPos = prevMatch.segIndex + prevMatch.t;
			const toPos = currMatch.segIndex + currMatch.t;
			if (fromPos <= toPos) {
				for (let idx = prevMatch.segIndex + 1; idx <= currMatch.segIndex; idx++) pushDistinct(result, wayPoints[idx]);
			} else {
				for (let idx = prevMatch.segIndex; idx > currMatch.segIndex; idx--) pushDistinct(result, wayPoints[idx]);
			}
			pushDistinct(result, currMatch.point);
		} else {
			pushDistinct(result, currMatch ? currMatch.point : points[i]);
		}
	}

	return result;
}
