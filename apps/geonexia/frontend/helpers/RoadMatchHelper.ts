/**
 * Snaps a recorded GPS track onto the real-world road/path network (true map
 * matching), as opposed to `RouteSmootherHelper.snapToRoad` which only smooths
 * the track against its *own* shape. Uses the same PBF vector-tile
 * infrastructure as `TileFeatureHelper.ts` (no MapLibre map instance or
 * backend routing service required) to fetch nearby road/path line geometry.
 *
 * Unlike a naive "snap each point to its nearest road independently" approach,
 * `matchRouteToRoads` tries to figure out *which* road/path was walked along:
 * - consecutive GPS points that land on the same way are connected using that
 *   way's own vertices (so the line follows the road's actual shape instead of
 *   cutting a straight line between two independently-snapped points);
 * - an isolated point that lands on a different, nearby parallel way than both
 *   its neighbours is treated as GPS noise and pulled back onto the
 *   neighbours' way;
 * - when the walk moves from one way to a *different* one, instead of cutting
 *   a straight line across the corner, a small local shortest-path search
 *   (over a graph built from all fetched ways) finds a real road/path route
 *   between them - simulating "walk to the junction" (following the first
 *   way's remaining bends) and, if the two ways don't directly touch,
 *   bridging the gap via whichever other nearby ways connect them.
 */

import Pbf from 'pbf';
import { VectorTile, type VectorTileFeature, type VectorTileLayer } from '@mapbox/vector-tile';

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

/** Normalize a vector-tile feature's GeoJSON geometry into an array of coordinate lines. */
function geometryToLines(geometry: ReturnType<VectorTileFeature['toGeoJSON']>['geometry']): [number, number][][] {
	if (geometry.type === 'MultiLineString') return geometry.coordinates;
	if (geometry.type === 'LineString') return [geometry.coordinates];
	return [];
}

/**
 * Extract road/path polylines (as `RoadWay`s) from the `transportation` layer
 * of a decoded vector tile, converting each feature's GeoJSON geometry
 * (LineString or MultiLineString) into one or more ways.
 */
function extractRoadWaysFromLayer(
	layer: VectorTileLayer | undefined,
	x: number,
	y: number,
	z: number,
): RoadWay[] {
	const ways: RoadWay[] = [];
	if (!layer) return ways;

	for (let i = 0; i < layer.length; i++) {
		const feat = layer.feature(i);
		if (feat.type !== GEOMETRY_TYPE_LINE) continue;

		const geometry = feat.toGeoJSON(x, y, z).geometry;
		const lines = geometryToLines(geometry);

		for (const line of lines) {
			if (line.length >= 2) ways.push({ points: line });
		}
	}

	return ways;
}

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
	const ways = extractRoadWaysFromLayer(layer, x, y, z);

	roadWayTileCache[cacheKey] = ways;
	return ways;
}

/**
 * Fetch all road/path ways covering the given bounding box.
 * Zoom is picked automatically (same budget as `TileFeatureHelper.calculateOptimalZoom`)
 * to keep the number of tile downloads manageable for larger activities.
 *
 * Note: ways that cross a tile boundary are returned as separate fragments (one
 * per tile), since vector tiles clip geometry at tile edges. Where two fragments
 * share the exact same clip-boundary vertex, the road graph below still connects
 * them (see `buildRoadGraph`); a mismatch only degrades the connecting search to
 * "no path found", which falls back to a direct connect.
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

/**
 * Maximum length of the connecting route search performed when the walk moves
 * from one way to a different one (see `findConnectingPath`). Keeps the search
 * a "small, local" one, per the intent of only bridging genuine small gaps
 * between nearby ways rather than routing arbitrarily far.
 */
export const MAX_CONNECT_SEARCH_METERS = 500;

/** Rough meters-per-degree-latitude conversion; good enough for small local distances. */
function metersToDeg(meters: number): number {
	return meters / 111_320;
}

/** Non-squared version of `squaredDistDeg`, for summing path lengths. */
function distDeg(a: [number, number], b: [number, number]): number {
	return Math.sqrt(squaredDistDeg(a, b));
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
	const last = path.at(-1);
	if (last?.[0] !== pt[0] || last[1] !== pt[1]) path.push(pt);
}

/**
 * Returns the way's own intermediate vertices strictly between position
 * `fromSegIndex + fromT` and `toSegIndex + toT` (excluding both endpoints), in
 * whichever direction the walk goes - so the line follows the way's bends
 * instead of cutting a straight line between the two positions.
 */
function extractWaySubPath(
	wayPoints: [number, number][],
	fromSegIndex: number,
	fromT: number,
	toSegIndex: number,
	toT: number,
): [number, number][] {
	const fromPos = fromSegIndex + fromT;
	const toPos = toSegIndex + toT;
	const result: [number, number][] = [];
	if (fromPos <= toPos) {
		for (let idx = fromSegIndex + 1; idx <= toSegIndex; idx++) result.push(wayPoints[idx]);
	} else {
		for (let idx = fromSegIndex; idx > toSegIndex; idx--) result.push(wayPoints[idx]);
	}
	return result;
}

// ─── Road network graph & connecting-route search ──────────────────────────

/** Coordinate precision (decimal places) used to merge shared vertices into one graph node. */
const NODE_COORD_PRECISION = 6;

function nodeKey(pt: [number, number]): string {
	return `${pt[0].toFixed(NODE_COORD_PRECISION)},${pt[1].toFixed(NODE_COORD_PRECISION)}`;
}

type RoadGraph = {
	nodeCoords: [number, number][];
	adjacency: { to: number; dist: number }[][];
	nodeIndexByKey: Map<string, number>;
};

/**
 * Builds a graph where nodes are the (deduplicated) vertices of all ways and
 * edges are the ways' own segments. Two ways that share an exact vertex (a
 * real intersection) are connected there for free, so a shortest-path search
 * over this graph naturally "walks to the junction" along a way's remaining
 * segments before continuing onto the next way - no special-casing needed.
 */
function buildRoadGraph(ways: RoadWay[]): RoadGraph {
	const nodeIndexByKey = new Map<string, number>();
	const nodeCoords: [number, number][] = [];
	const adjacency: { to: number; dist: number }[][] = [];

	function getOrCreateNode(pt: [number, number]): number {
		const key = nodeKey(pt);
		const existing = nodeIndexByKey.get(key);
		if (existing !== undefined) return existing;
		const idx = nodeCoords.length;
		nodeCoords.push(pt);
		adjacency.push([]);
		nodeIndexByKey.set(key, idx);
		return idx;
	}

	for (const way of ways) {
		for (let i = 0; i < way.points.length - 1; i++) {
			const aIdx = getOrCreateNode(way.points[i]);
			const bIdx = getOrCreateNode(way.points[i + 1]);
			if (aIdx === bIdx) continue; // zero-length segment guard
			const d = distDeg(way.points[i], way.points[i + 1]);
			adjacency[aIdx].push({ to: bIdx, dist: d });
			adjacency[bIdx].push({ to: aIdx, dist: d });
		}
	}

	return { nodeCoords, adjacency, nodeIndexByKey };
}

function graphNodeIndex(graph: RoadGraph, pt: [number, number]): number | undefined {
	return graph.nodeIndexByKey.get(nodeKey(pt));
}

/** A candidate entry/exit point into the graph: a node plus the extra distance to reach it from off-graph. */
type WeightedNode = { nodeIndex: number; extraDist: number };

/**
 * Dijkstra search from any of `sources` to the nearest of `targets`, capped at
 * `maxTotalDistDeg` total distance (including the sources'/targets' extra
 * off-graph distances). Returns the node-index path (source → target) and its
 * total length, or `null` if nothing was found within the cap.
 *
 * The graph here is expected to stay small and local (bounded by the search
 * cap cutting off expansion), so a simple array-scan priority queue is fine.
 */
function findConnectingPath(
	graph: RoadGraph,
	sources: WeightedNode[],
	targets: WeightedNode[],
	maxTotalDistDeg: number,
): { path: number[]; distance: number } | null {
	if (sources.length === 0 || targets.length === 0) return null;

	const targetExtra = new Map<number, number>();
	for (const t of targets) {
		const prevExtra = targetExtra.get(t.nodeIndex);
		if (prevExtra === undefined || t.extraDist < prevExtra) targetExtra.set(t.nodeIndex, t.extraDist);
	}

	const dist = new Map<number, number>();
	const prev = new Map<number, number>();
	const queue: { nodeIndex: number; dist: number }[] = [];

	for (const s of sources) {
		if (!dist.has(s.nodeIndex) || s.extraDist < dist.get(s.nodeIndex)!) {
			dist.set(s.nodeIndex, s.extraDist);
			queue.push({ nodeIndex: s.nodeIndex, dist: s.extraDist });
		}
	}

	const visited = new Set<number>();

	while (queue.length > 0) {
		let minIdx = 0;
		for (let i = 1; i < queue.length; i++) {
			if (queue[i].dist < queue[minIdx].dist) minIdx = i;
		}
		const current = queue.splice(minIdx, 1)[0];
		if (visited.has(current.nodeIndex)) continue;
		visited.add(current.nodeIndex);

		const extra = targetExtra.get(current.nodeIndex);
		if (extra !== undefined) {
			const totalDist = current.dist + extra;
			if (totalDist > maxTotalDistDeg) return null;
			const path: number[] = [current.nodeIndex];
			let node = current.nodeIndex;
			while (prev.has(node)) {
				node = prev.get(node)!;
				path.push(node);
			}
			path.reverse();
			return { path, distance: totalDist };
		}

		if (current.dist > maxTotalDistDeg) continue;

		for (const edge of graph.adjacency[current.nodeIndex]) {
			if (visited.has(edge.to)) continue;
			const newDist = current.dist + edge.dist;
			if (newDist > maxTotalDistDeg) continue;
			const existing = dist.get(edge.to);
			if (existing === undefined || newDist < existing) {
				dist.set(edge.to, newDist);
				prev.set(edge.to, current.nodeIndex);
				queue.push({ nodeIndex: edge.to, dist: newDist });
			}
		}
	}

	return null;
}

/** The two endpoint vertices of `match`'s segment, each weighted by their distance from `match.point`. */
function segmentEndpointsAsWeightedNodes(graph: RoadGraph, wayPoints: [number, number][], match: PointMatch): WeightedNode[] {
	const nodes: WeightedNode[] = [];
	const a = wayPoints[match.segIndex];
	const b = wayPoints[match.segIndex + 1];
	const aIdx = graphNodeIndex(graph, a);
	if (aIdx !== undefined) nodes.push({ nodeIndex: aIdx, extraDist: distDeg(match.point, a) });
	const bIdx = graphNodeIndex(graph, b);
	if (bIdx !== undefined) nodes.push({ nodeIndex: bIdx, extraDist: distDeg(match.point, b) });
	return nodes;
}

// ─── Junction-connection variants ───────────────────────────────────────────

/**
 * How a transition from one matched way to a different one is connected.
 * - `direct`: cut a straight line between the two snapped points (no
 *   junction handling at all - the simplest, most predictable baseline).
 * - `network`: full shortest-path search over all fetched ways (see
 *   `findConnectingPath`) - the most road-accurate, but depends on the vector
 *   tile data actually connecting the ways the way they're connected in
 *   reality (see `ENDPOINT_BRIDGE_METERS` for how tile-clipping gaps in that
 *   connectivity are compensated for).
 */
export type RoadMatchJunctionMode = 'direct' | 'network';

export const DEFAULT_ROAD_MATCH_JUNCTION_MODE: RoadMatchJunctionMode = 'network';

// ─── Main matching ──────────────────────────────────────────────────────────

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
 *   so the line follows the road/path shape that was actually walked.
 * - Consecutive points matched to *different* ways are connected according to
 *   `junctionMode` (see `RoadMatchJunctionMode`) instead of a straight cut
 *   across the corner. Where that produces no result (e.g. `network` mode
 *   found no path within `MAX_CONNECT_SEARCH_METERS`), falls back to a direct
 *   connect between the two points.
 */
export function matchRouteToRoads(
	points: [number, number][],
	ways: RoadWay[],
	options: {
		maxSnapDistanceMeters?: number;
		junctionMode?: RoadMatchJunctionMode;
	} = {},
): [number, number][] {
	if (ways.length === 0 || points.length === 0) return points;

	const maxSnapDistanceMeters = options.maxSnapDistanceMeters ?? DEFAULT_MAX_SNAP_DISTANCE_METERS;
	const junctionMode = options.junctionMode ?? DEFAULT_ROAD_MATCH_JUNCTION_MODE;

	const grid = buildSegmentGrid(ways);
	const maxDistDegSq = metersToDeg(maxSnapDistanceMeters) ** 2;
	const noiseDegSq = metersToDeg(GPS_NOISE_THRESHOLD_METERS) ** 2;
	const maxConnectDistDeg = metersToDeg(MAX_CONNECT_SEARCH_METERS);

	const matches: (PointMatch | null)[] = points.map((pt) => findBestMatch(pt, grid, maxDistDegSq));

	// Isolated-point correction: point i differs from both neighbours, which
	// agree with each other - and point i is close enough to the neighbours'
	// way to plausibly be a noisy reading of the same way, not a real detour.
	for (let i = 1; i < matches.length - 1; i++) {
		const prev = matches[i - 1];
		const next = matches[i + 1];
		if (!prev || !next || prev.wayIndex !== next.wayIndex) continue;
		const curr = matches[i];
		if (curr?.wayIndex === prev.wayIndex) continue;

		const alt = findBestMatchOnWay(points[i], ways[prev.wayIndex], prev.wayIndex, noiseDegSq);
		if (alt) matches[i] = alt;
	}

	// Built lazily - only needed once a way-to-way transition actually occurs.
	let graph: RoadGraph | null = null;

	const result: [number, number][] = [];
	pushDistinct(result, matches[0] ? matches[0].point : points[0]);

	for (let i = 1; i < points.length; i++) {
		const prevMatch = matches[i - 1];
		const currMatch = matches[i];

		if (currMatch && prevMatch?.wayIndex === currMatch.wayIndex) {
			// Follow the way's own vertices between the two projections instead of
			// cutting a straight line, in whichever direction the walk went.
			const wayPoints = ways[prevMatch.wayIndex].points;
			for (const pt of extractWaySubPath(wayPoints, prevMatch.segIndex, prevMatch.t, currMatch.segIndex, currMatch.t)) {
				pushDistinct(result, pt);
			}
			pushDistinct(result, currMatch.point);
		} else if (prevMatch && currMatch && junctionMode === 'direct') {
			pushDistinct(result, currMatch.point);
		} else if (prevMatch && currMatch) {
			// 'network': search for a real road/path route between them instead of
			// cutting a straight line across the corner.
			graph ??= buildRoadGraph(ways);
			const sources = segmentEndpointsAsWeightedNodes(graph, ways[prevMatch.wayIndex].points, prevMatch);
			const targets = segmentEndpointsAsWeightedNodes(graph, ways[currMatch.wayIndex].points, currMatch);
			const connection = findConnectingPath(graph, sources, targets, maxConnectDistDeg);
			if (connection) {
				for (const nodeIdx of connection.path) pushDistinct(result, graph.nodeCoords[nodeIdx]);
			}
			pushDistinct(result, currMatch.point);
		} else {
			pushDistinct(result, currMatch ? currMatch.point : points[i]);
		}
	}

	return result;
}
