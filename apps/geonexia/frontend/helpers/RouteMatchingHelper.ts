import { SavedRoute } from './RouteStorage';

// ─── Route matching ──────────────────────────────────────────────────────────

/**
 * Default threshold for considering two routes as matching.
 * A value of 0.9 means at least 90% of hex tiles must overlap.
 */
export const ROUTE_MATCH_THRESHOLD = 0.9;

/**
 * Compute the overlap ratio between two sets of hex tiles.
 * The ratio is computed as:
 *   |intersection| / |union|
 * This is the Jaccard similarity index, which is symmetric (A vs B = B vs A).
 *
 * Returns a value in [0, 1] where 1.0 means identical tile sets.
 */
export function computeRouteOverlap(hexTilesA: string[], hexTilesB: string[]): number {
	if (hexTilesA.length === 0 && hexTilesB.length === 0) return 1;
	if (hexTilesA.length === 0 || hexTilesB.length === 0) return 0;

	const setA = new Set(hexTilesA);
	const setB = new Set(hexTilesB);

	let intersectionCount = 0;
	for (const tile of setA) {
		if (setB.has(tile)) {
			intersectionCount++;
		}
	}

	const unionCount = setA.size + setB.size - intersectionCount;
	return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Result of a route match search.
 */
export type RouteMatchResult = {
	route: SavedRoute;
	overlap: number;
};

/**
 * Find all saved routes that match the given hex tiles above a threshold.
 * Returns matches sorted by overlap descending (best match first).
 *
 * Only routes with the same H3 resolution are compared.
 */
export function findMatchingRoutes(
	activityHexTiles: string[],
	savedRoutes: SavedRoute[],
	h3Resolution: number,
	threshold: number = ROUTE_MATCH_THRESHOLD,
): RouteMatchResult[] {
	const matches: RouteMatchResult[] = [];

	for (const route of savedRoutes) {
		// Only compare routes recorded at the same H3 resolution
		if (route.h3Resolution !== h3Resolution) continue;

		const overlap = computeRouteOverlap(activityHexTiles, route.hexTiles);
		if (overlap >= threshold) {
			matches.push({ route, overlap });
		}
	}

	// Sort by overlap descending (best match first)
	matches.sort((a, b) => b.overlap - a.overlap);
	return matches;
}
