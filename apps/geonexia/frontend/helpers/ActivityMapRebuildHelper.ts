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

import { latLngToCell, isAvailable as isH3Available } from './H3Helper';
import { BillboardAnchorColor, ActivityReference, HexTileRecord, computeHexTileLevel } from './HexTileStorage';
import { ComputedActivityData, ComputedHexTileEntry, SavedActivity } from './ActivityStorage';
import type { HexTileFeatureCache } from './HexTileFeatureStorage';
import type { MapFeatureInfo } from './RouteNameSuggestionHelper';
import {
	OpenMapTilesLayerId,
	LandcoverClass,
	LandcoverSubclass,
	ParkClass,
} from './OpenMapTilesSchema';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Fallback H3 resolution used for activities that pre-date the stored field. */
const H3_RESOLUTION_FALLBACK = 10;

/**
 * Billboard key for the treePineSmall sprite (index 51 in OBJECT_SPRITES).
 * Placed at the purple anchor (hex centroid) on forest tiles that are enclosed.
 */
const BILLBOARD_PINE_TREE_SMALL = 'objects:51';

/** Terrain image key applied to tiles that have been visited (walked on). */
const TILE_IMAGE_DIRT = 'Dirt/dirt';

/** Terrain image key applied to tiles that are enclosed but not walked on. */
const TILE_IMAGE_GRASS = 'Grass/grass';

// ─── Internal helpers ─────────────────────────────────────────────────────────

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

/**
 * Returns true when any of the map features indicate that the tile contains
 * a forested area (landcover wood/forest or park forest class).
 */
function isForestTile(features: MapFeatureInfo[]): boolean {
	return features.some(
		(f) =>
			(f.layerId === OpenMapTilesLayerId.LANDCOVER &&
				(f.class === LandcoverClass.WOOD || f.subclass === LandcoverSubclass.FOREST)) ||
			(f.layerId === OpenMapTilesLayerId.PARK && f.class === ParkClass.FOREST),
	);
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

	const orderedHexTiles: ComputedHexTileEntry[] = hexTilesOrdered.map((hexId) => {
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
		orderedHexTiles,
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
 *  - **Visited tiles** (visitCount > 0) → tileImage = "Dirt/dirt"
 *  - **Enclosed-only tiles** (enclosedCount > 0, visitCount = 0)
 *      → tileImage = "Grass/grass"
 *      → if the tile is a forest (according to `hexTileFeatureCache`)
 *           → billboard at purple anchor = "objects:51" (treePineSmall)
 *
 * @param activities         All saved activities to process.
 * @param hexTileFeatureCache  Cache of map features keyed by H3 index.
 *                             Used for forest detection.  Pass an empty object
 *                             if the cache is not available.
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
		const orderedHexTiles: ComputedHexTileEntry[] =
			activity.computed?.orderedHexTiles ??
			(activity.hexTilesOrdered ?? []).map((hexId) => ({ hexId, avgSpeedKmh: 0 }));

		const enclosedHexTiles: string[] = activity.computed?.enclosedHexTiles ?? [];

		// ── Process visited (walked) tiles ────────────────────────────────────
		for (let i = 0; i < orderedHexTiles.length; i++) {
			const { hexId } = orderedHexTiles[i];
			const rec = getOrCreateRecord(records, hexId);

			// Update timestamps
			if (rec.lastVisitedAt === null || endedAt > rec.lastVisitedAt) {
				rec.lastVisitedAt = endedAt;
			}

			// Add or merge the activity reference
			if (!rec.activityReferences) rec.activityReferences = [];
			const existingRef = rec.activityReferences.find(
				(r: ActivityReference) => r.activityId === activityId,
			);
			if (existingRef) {
				existingRef.walkedIndex = i;
			} else {
				rec.activityReferences.push({ activityId, walkedIndex: i });
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
			const existingRef = rec.activityReferences.find(
				(r: ActivityReference) => r.activityId === activityId,
			);
			if (existingRef) {
				existingRef.enclosedIndex = i;
			} else {
				rec.activityReferences.push({ activityId, enclosedIndex: i });
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
		} else if (rec.enclosedCount > 0) {
			// Enclosed but not visited → grass terrain
			rec.tileImage = TILE_IMAGE_GRASS;

			// Forest tiles additionally get a pine tree billboard at the centroid.
			const features = hexTileFeatureCache[hexId] ?? [];
			if (isForestTile(features)) {
				if (!rec.billboards) rec.billboards = {};
				rec.billboards[BillboardAnchorColor.Purple] = BILLBOARD_PINE_TREE_SMALL;
			}
		}
	}

	return { records, walkedEdges: Array.from(edgeSet) };
}
