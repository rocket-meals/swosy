/**
 * ActivityMapRebuildHelper
 *
 * Two responsibilities:
 *
 *  1. `computeActivityData` – derive the `ComputedActivityData` blob that is
 *     stored on a `SavedActivity`.  Needs to be called once after recording
 *     stops (before saving) and whenever an old activity is migrated.
 *
 *  2. `rebuildMapFromActivities` – reconstruct the complete hex-tile map state
 *     from a list of activities, returning fresh `HexTileRecord` and
 *     `walkedEdges` values that can be loaded into the Redux store.
 *
 * Both functions are pure (no side-effects, no Redux dispatch) so they are
 * easy to test and call from any context.
 */

import { latLngToCell, cellToLatLng, cellToBoundary, gridDisk, gridDistance, areNeighborCells, isAvailable as isH3Available } from './H3Helper';
import { BillboardAnchorColor, ActivityReference, HexTileRecord, computeHexTileLevel } from './HexTileStorage';
import { ComputedActivityData, ComputedHexTileEntry, SavedActivity } from './ActivityStorage';
import type { HexTileFeatureCache } from './HexTileFeatureStorage';
import type { MapFeatureInfo } from './RouteNameSuggestionHelper';
import { OpenMapTilesLayerId, LandcoverClass, LandcoverSubclass, ParkClass } from './OpenMapTilesSchema';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Fallback H3 resolution used for activities that pre-date the stored field. */
export const H3_RESOLUTION_FALLBACK = 10;
const H3_RESOLUTION_MIN = 0;
const H3_RESOLUTION_MAX = 15;

/** Padding added to the bounding box (degrees) when enumerating candidate cells. */
const BBOX_PADDING_DEG = 0.001;

/** Safety cap on the grid-disk radius used to enumerate candidate cells. */
const MAX_GRID_DISK_RADIUS = 30;

/**
 * Billboard key for the treePineLarge sprite (index 50 in OBJECT_SPRITES).
 * Placed at the purple anchor (hex centroid) on all enclosed tiles.
 */
const BILLBOARD_PINE_TREE_LARGE = 'objects:50';

/**
 * Billboard key for the pathRounded sprite (index 58 in OBJECT_SPRITES).
 * Placed flat at edge-midpoint anchors on walked tiles toward walked neighbors.
 */
const BILLBOARD_PATH_ROUNDED = 'objects:58';

/** Terrain image key applied to tiles that have been visited (walked on). */
const TILE_IMAGE_DIRT = 'Dirt/dirt';

/** Terrain image key applied to tiles that are enclosed but not walked on. */
const TILE_IMAGE_GRASS = 'Grass/grass';

// ─── Edge anchor helpers ──────────────────────────────────────────────────────

/**
 * Maps boundary edge index (0–5) to the corresponding BillboardAnchorColor for
 * edge-midpoint positions. Edge 0 is between vertex[0] and vertex[1], etc.
 */
const EDGE_INDEX_TO_ANCHOR: BillboardAnchorColor[] = [
	BillboardAnchorColor.EdgeNE, // edge 0: vertex[0]→vertex[1]
	BillboardAnchorColor.EdgeE,  // edge 1: vertex[1]→vertex[2]
	BillboardAnchorColor.EdgeSE, // edge 2: vertex[2]→vertex[3]
	BillboardAnchorColor.EdgeSW, // edge 3: vertex[3]→vertex[4]
	BillboardAnchorColor.EdgeW,  // edge 4: vertex[4]→vertex[5]
	BillboardAnchorColor.EdgeNW, // edge 5: vertex[5]→vertex[0]
];

/**
 * Find which edge index (0–5) of `hexId` faces toward `neighborId`.
 * Uses the hex boundary vertices: the edge whose midpoint is closest to the
 * neighbor's centroid is the shared edge.
 * Returns -1 when the boundary cannot be computed or H3 is unavailable.
 */
function getEdgeIndexTowardNeighbor(hexId: string, neighborId: string): number {
	try {
		// cellToBoundary with geoJsonOrder=true returns [lng,lat] pairs and closes
		// the ring (first vertex repeated at end). We have n unique vertices.
		const boundary = cellToBoundary(hexId, true) as Array<[number, number]>;
		const n = boundary.length - 1; // exclude the repeated closing vertex
		if (n < 6) return -1;

		const [nLat, nLng] = cellToLatLng(neighborId);

		let bestIdx = 0;
		let bestDist = Infinity;
		for (let i = 0; i < n; i++) {
			const [lng1, lat1] = boundary[i];
			const [lng2, lat2] = boundary[(i + 1) % n];
			const midLng = (lng1 + lng2) / 2;
			const midLat = (lat1 + lat2) / 2;
			const dLat = midLat - nLat;
			const dLng = midLng - nLng;
			const dist = dLat * dLat + dLng * dLng;
			if (dist < bestDist) {
				bestDist = dist;
				bestIdx = i;
			}
		}
		return bestIdx;
	} catch {
		return -1;
	}
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Ray-casting point-in-polygon test. Polygon is an array of [lng, lat] pairs. */
function pointInPolygon(lng: number, lat: number, polygon: Array<[number, number]>): boolean {
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const [xi, yi] = polygon[i];
		const [xj, yj] = polygon[j];
		const intersect =
			yi > lat !== yj > lat &&
			lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

/**
 * Find all H3 cells enclosed by the polygon formed by the centroids of the
 * visited hex tiles (in visit order). Visited tiles are excluded from the
 * result. Returns an empty array when:
 *  – fewer than 3 tiles were visited,
 *  – the first and last hex tiles are not adjacent (open route), or
 *  – the H3 library is unavailable.
 *
 * Using hex-tile centroids instead of raw GPS points is faster because the
 * polygon has far fewer vertices (one per unique visited tile).
 */
export function findEnclosedCellsFromHexTiles(
	visitedHexIds: string[],
	resolution: number,
): string[] {
	if (!isH3Available() || visitedHexIds.length < 3) return [];

	const h3Res = Math.max(H3_RESOLUTION_MIN, Math.min(H3_RESOLUTION_MAX, Math.floor(resolution)));

	// Build a polygon ([lng, lat] pairs) from the centroids of the visited tiles.
	const polygon: Array<[number, number]> = [];
	for (const hexId of visitedHexIds) {
		try {
			const [lat, lng] = cellToLatLng(hexId);
			polygon.push([lng, lat]);
		} catch {
			// skip invalid cells
		}
	}
	if (polygon.length < 3) return [];

	// Check loop closure: first and last hex tiles must be the same cell or adjacent neighbors.
	const firstHex = visitedHexIds[0];
	const lastHex = visitedHexIds[visitedHexIds.length - 1];
	if (firstHex !== lastHex && !areNeighborCells(firstHex, lastHex)) return [];

	// Bounding box with small padding.
	const lngs = polygon.map(([lng]) => lng);
	const lats = polygon.map(([, lat]) => lat);
	const minLat = Math.min(...lats) - BBOX_PADDING_DEG;
	const maxLat = Math.max(...lats) + BBOX_PADDING_DEG;
	const minLng = Math.min(...lngs) - BBOX_PADDING_DEG;
	const maxLng = Math.max(...lngs) + BBOX_PADDING_DEG;

	const centerLat = (maxLat + minLat) / 2;
	const centerLng = (maxLng + minLng) / 2;
	const centerCell = latLngToCell(centerLat, centerLng, h3Res);

	let maxK = 0;
	const corners: Array<[number, number]> = [
		[maxLat, maxLng],
		[maxLat, minLng],
		[minLat, maxLng],
		[minLat, minLng],
	];
	for (const [lat, lng] of corners) {
		try {
			const cornerCell = latLngToCell(lat, lng, h3Res);
			const dist = gridDistance(centerCell, cornerCell);
			if (dist > maxK) maxK = dist;
		} catch {
			// ignore
		}
	}

	const visitedSet = new Set(visitedHexIds);
	const candidates = gridDisk(centerCell, Math.min(maxK + 1, MAX_GRID_DISK_RADIUS));
	const enclosed: string[] = [];
	for (const cell of candidates) {
		if (visitedSet.has(cell)) continue;
		try {
			const [cellLat, cellLng] = cellToLatLng(cell);
			if (pointInPolygon(cellLng, cellLat, polygon)) {
				enclosed.push(cell);
			}
		} catch {
			// ignore invalid cells
		}
	}
	return enclosed;
}


/**
 * Returns `true` when the given feature list contains at least one feature that
 * indicates a forest / wooded area.  Checks:
 *  - `landcover` layer with `class = 'wood'` or `subclass = 'forest'`
 *  - `park` layer with `class = 'forest'`
 */
function hasForestFeature(features: MapFeatureInfo[]): boolean {
	return features.some(
		(f) =>
			(f.layerId === OpenMapTilesLayerId.LANDCOVER &&
				(f.class === LandcoverClass.WOOD || f.subclass === LandcoverSubclass.FOREST)) ||
			(f.layerId === OpenMapTilesLayerId.PARK && f.class === ParkClass.FOREST),
	);
}

function getOrCreateRecord(
	records: Record<string, HexTileRecord>,
	h3Index: string,
): HexTileRecord {
	if (!records[h3Index]) {
		records[h3Index] = {
			h3Index,
			lastVisitedAt: null,
			lastEnclosedAt: null,
			visitCount: 0,
			enclosedCount: 0,
			level: 0,
			walkedOn: false,
		};
	}
	return records[h3Index];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the `ComputedActivityData` blob for a `SavedActivity`.
 *
 * Call this:
 *  - immediately after a recording stops (before `saveActivity`), so the data
 *    is persisted alongside the raw GPS points.
 *  - during a full map rebuild for any activity that is missing the field.
 *
 * @param activity        The activity whose GPS points will be processed.
 * @param enclosedHexTiles  Hex cell IDs that were enclosed by the route loop
 *                          but not physically walked on.  Pass the value
 *                          computed by `findEnclosedCells` at recording time.
 */
export function computeActivityData(
	activity: SavedActivity,
	enclosedHexTiles: string[],
): ComputedActivityData {
	const h3Resolution = activity.h3Resolution ?? H3_RESOLUTION_FALLBACK;
	const hexTilesOrdered = activity.hexTilesOrdered ?? [];

	// Build a map from H3 cell → list of GPS speeds (km/h) recorded inside it.
	const hexSpeeds: Record<string, number[]> = {};

	if (isH3Available()) {
		for (const point of activity.routePoints) {
			if (point.speed == null || point.speed < 0) continue;
			try {
				const cell = latLngToCell(point.lat, point.lng, h3Resolution);
				if (!hexSpeeds[cell]) hexSpeeds[cell] = [];
				// Expo Location speed is in m/s → convert to km/h
				hexSpeeds[cell].push(point.speed * 3.6);
			} catch {
				// Skip invalid GPS points
			}
		}
	}

	const hexTilesVisited: ComputedHexTileEntry[] = hexTilesOrdered.map((hexId) => {
		const speeds = hexSpeeds[hexId] ?? [];
		const avgSpeedKmh =
			speeds.length > 0
				? speeds.reduce((sum, s) => sum + s, 0) / speeds.length
				: 0;
		return { hexId, avgSpeedKmh };
	});

	return {
		maxSpeedKmh: activity.stats.maxSpeedKmh,
		minSpeedKmh: activity.stats.minSpeedKmh,
		avgSpeedKmh: activity.stats.avgSpeedKmh,
		hexTilesVisited,
		enclosedHexTiles,
	};
}

/**
 * Rebuild the complete hex-tile map state from a list of saved activities.
 *
 * The function reads the `computed` field of each activity (falling back to
 * the raw `hexTilesOrdered` list for older saves without `computed`).
 * It aggregates per-tile visit/enclosure counts, stores back-references for
 * fast future lookups, and applies automatic terrain customisations:
 *
 *  - **Visited tiles** (visitCount > 0)
 *      → tileImage = "Dirt/dirt"
 *      → pathRounded billboard (flat) at each edge midpoint that faces a walked neighbor
 *  - **Enclosed-only tiles** (enclosedCount > 0, visitCount = 0)
 *      → tileImage = "Grass/grass"
 *      → pineTreeLarge billboard at purple anchor (hex centroid), only when the
 *         hex-tile feature cache confirms a forest / wooded area on that tile
 *
 * @param activities         All saved activities to process.
 * @param hexTileFeatureCache  Optional per-hex feature cache.  When provided,
 *                             the pineTreeLarge billboard is only placed on
 *                             enclosed tiles that have a forest feature
 *                             (landcover class=wood / subclass=forest, or
 *                             park class=forest).  Tiles without cached
 *                             features receive only the grass terrain image.
 * @returns `{ records, walkedEdges }` – fresh state ready to be loaded into
 *          the Redux hex-tile slice via `loadPersistedState` /
 *          `loadWalkedEdgesState`.
 */
export function rebuildMapFromActivities(
	activities: SavedActivity[],
	hexTileFeatureCache: HexTileFeatureCache = {},
): { records: Record<string, HexTileRecord>; walkedEdges: string[] } {
	const records: Record<string, HexTileRecord> = {};
	const edgeSet = new Set<string>();

	for (const activity of activities) {
		const activityId = activity.id;
		const endedAt = activity.endedAt;

		// ── Derive the ordered and enclosed tile lists ────────────────────────
		// Prefer the pre-computed field; fall back to the raw ordered list for
		// activities saved before the computed field was introduced.
		// For backward-compat, also accept the legacy `orderedHexTiles` field name.
		const orderedHexTiles: ComputedHexTileEntry[] =
			activity.computed?.hexTilesVisited ??
			(activity.computed as { orderedHexTiles?: ComputedHexTileEntry[] } | undefined)?.orderedHexTiles ??
			(activity.hexTilesOrdered ?? []).map((hexId) => ({ hexId, avgSpeedKmh: 0 }));

		// Prefer computed.enclosedHexTiles (the canonical field); fall back to the
		// legacy top-level fields for activities saved by older app versions.
		const enclosedHexTiles: string[] =
			activity.computed?.enclosedHexTiles ??
			activity.enclosedHexTiles ??
			activity.hexTilesEnclosed ??
			[];

		// ── Process visited (walked) tiles ────────────────────────────────────
		// Pre-build a map for O(1) lookup of existing references for this activity.
		const refByHexId = new Map<string, ActivityReference>();
		for (const rec of Object.values(records)) {
			if (!rec.activityReferences) continue;
			const ref = rec.activityReferences.find(
				(r: ActivityReference) => r.activityId === activityId,
			);
			if (ref) refByHexId.set(rec.h3Index, ref);
		}

		for (let i = 0; i < orderedHexTiles.length; i++) {
			const { hexId } = orderedHexTiles[i];
			const rec = getOrCreateRecord(records, hexId);

			// Update timestamps
			if (rec.lastVisitedAt === null || endedAt > rec.lastVisitedAt) {
				rec.lastVisitedAt = endedAt;
			}

			// Add or merge the activity reference
			if (!rec.activityReferences) rec.activityReferences = [];
			const existingRef = refByHexId.get(hexId);
			if (existingRef) {
				existingRef.walkedIndex = i;
			} else {
				const newRef: ActivityReference = { activityId, walkedIndex: i };
				rec.activityReferences.push(newRef);
				refByHexId.set(hexId, newRef);
			}

			// Build walked edges from consecutive tile pairs
			if (i > 0) {
				const prev = orderedHexTiles[i - 1].hexId;
				const edge = prev < hexId ? `${prev}:${hexId}` : `${hexId}:${prev}`;
				edgeSet.add(edge);
			}
		}

		// ── Process enclosed tiles ────────────────────────────────────────────
		for (let i = 0; i < enclosedHexTiles.length; i++) {
			const hexId = enclosedHexTiles[i];
			const rec = getOrCreateRecord(records, hexId);

			// Update timestamps
			if (rec.lastEnclosedAt === null || endedAt > rec.lastEnclosedAt) {
				rec.lastEnclosedAt = endedAt;
			}

			// Add or merge the activity reference
			if (!rec.activityReferences) rec.activityReferences = [];
			const existingRef = refByHexId.get(hexId);
			if (existingRef) {
				existingRef.enclosedIndex = i;
			} else {
				const newRef: ActivityReference = { activityId, enclosedIndex: i };
				rec.activityReferences.push(newRef);
				refByHexId.set(hexId, newRef);
			}
		}
	}

	// ── Second pass: compute counts, levels, and tile images ─────────────────
	for (const [hexId, rec] of Object.entries(records)) {
		const refs: ActivityReference[] = rec.activityReferences ?? [];

		// Count distinct activities that visited / enclosed this tile.
		const visitedActivities = new Set(
			refs.filter((r) => r.walkedIndex !== undefined).map((r) => r.activityId),
		);
		const enclosedActivities = new Set(
			refs.filter((r) => r.enclosedIndex !== undefined).map((r) => r.activityId),
		);

		rec.visitCount = visitedActivities.size;
		rec.enclosedCount = enclosedActivities.size;
		rec.walkedOn = rec.visitCount > 0;
		rec.level = computeHexTileLevel(rec);

		// Apply automatic tile-image and billboard assignments.
		if (rec.visitCount > 0) {
			// Visited tile → dirt terrain
			rec.tileImage = TILE_IMAGE_DIRT;

			// Place a path object (flat) at each edge midpoint that faces a walked
			// neighbor tile, indicating the route direction.
			if (isH3Available()) {
				// Get the 6 immediate neighbors of this tile.
				const neighbors = gridDisk(hexId, 1).filter((n) => n !== hexId);
				for (const neighbor of neighbors) {
					const edgeStr = hexId < neighbor ? `${hexId}:${neighbor}` : `${neighbor}:${hexId}`;
					if (!edgeSet.has(edgeStr)) continue;
					const edgeIdx = getEdgeIndexTowardNeighbor(hexId, neighbor);
					if (edgeIdx < 0 || edgeIdx >= EDGE_INDEX_TO_ANCHOR.length) continue;
					const anchorColor = EDGE_INDEX_TO_ANCHOR[edgeIdx];
					if (!rec.billboards) rec.billboards = {};
					rec.billboards[anchorColor] = BILLBOARD_PATH_ROUNDED;
					if (!rec.billboardsFlat) rec.billboardsFlat = {};
					rec.billboardsFlat[anchorColor] = true;
				}
			}
		} else if (rec.enclosedCount > 0) {
			// Enclosed but not visited → grass terrain; pineTreeLarge only when
			// the feature cache confirms a forest / wooded area on this tile.
			rec.tileImage = TILE_IMAGE_GRASS;

			const cachedFeatures = hexTileFeatureCache[hexId];
			if (cachedFeatures && hasForestFeature(cachedFeatures)) {
				if (!rec.billboards) rec.billboards = {};
				rec.billboards[BillboardAnchorColor.Purple] = BILLBOARD_PINE_TREE_LARGE;
			}
		}
	}

	return { records, walkedEdges: Array.from(edgeSet) };
}
