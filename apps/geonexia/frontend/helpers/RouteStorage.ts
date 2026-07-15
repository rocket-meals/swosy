import { getStorageItem, setStorageItem, removeStorageItem } from 'repo-depkit-common-ui';
import type { RedLineRouteFields } from './ActivityRouteSharedTypes';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type SavedRoute = RedLineRouteFields & {
	name: string;
	/** Ordered sequence of H3 hex tile indices representing the route. */
	hexTiles: string[];
	/** H3 resolution used when recording the route. Always set for routes (unlike `SavedActivity`). */
	h3Resolution: number;
	/** Unix timestamp (ms) when the route was first created. */
	createdAt: number;
	/**
	 * IDs of activities that have been assigned to this route.
	 * Maintained as the reverse side of `SavedActivity.routeId`.
	 * Optional for backward-compat with older saves that lack this field.
	 */
	activityIds?: string[];
	/**
	 * Actual hex-to-hex transitions that occurred along the route, stored as
	 * "cellA:cellB" strings where cellA is lexicographically smaller than cellB.
	 * Used to draw walk path lines between hexagons on the route detail screen.
	 * Optional for backward-compat with older saves that lack this field.
	 */
	walkedEdges?: string[];
	/**
	 * H3 cell indices of the tiles enclosed by the route loop.
	 * Computed once on the route detail screen and cached here to avoid
	 * recomputation on every screen visit.  An empty array means the route
	 * was checked and found to enclose no cells (not a closed loop).
	 * `undefined` means not yet computed (older saves or shape changed).
	 * Optional for backward-compat with older saves that lack this field.
	 */
	enclosedTiles?: string[];
};

// ─── Storage keys ─────────────────────────────────────────────────────────────

// One key per route, plus an index key listing which route IDs exist (mirrors
// the old one-file-per-route directory layout, since the sqlite kv store has
// no directory-listing equivalent).
const ROUTES_INDEX_KEY = 'geonexia-routes-index.json';

function getRouteKey(id: string): string {
	return `geonexia-route-${id}.json`;
}

async function getRouteIds(): Promise<string[]> {
	try {
		const raw = await getStorageItem(ROUTES_INDEX_KEY);
		if (raw === null) return [];
		const ids = JSON.parse(raw);
		return Array.isArray(ids) ? ids : [];
	} catch {
		return [];
	}
}

// ─── Route persistence ───────────────────────────────────────────────────────

function isValidRoute(obj: unknown): obj is SavedRoute {
	if (typeof obj !== 'object' || obj === null) return false;
	const r = obj as Record<string, unknown>;
	return (
		typeof r.id === 'string' &&
		typeof r.name === 'string' &&
		Array.isArray(r.hexTiles) &&
		typeof r.h3Resolution === 'number' &&
		typeof r.createdAt === 'number'
	);
}

/**
 * Migrate a route loaded from disk to the current schema.
 * Handles old saves that used `walkedEdgesH11` (resolution hard-coded in the
 * field name) by copying the edges to `walkedEdgesRedLine` and setting
 * `walkedEdgesRedLineResolution = 11`.
 */
function migrateRoute(route: SavedRoute): SavedRoute {
	const r = route as SavedRoute & { walkedEdgesH11?: string[] };
	if (r.walkedEdgesH11 !== undefined && route.walkedEdgesRedLine === undefined) {
		const { walkedEdgesH11, ...rest } = r;
		return { ...rest, walkedEdgesRedLine: walkedEdgesH11, walkedEdgesRedLineResolution: 11 };
	}
	return route;
}

export async function saveRoute(route: SavedRoute): Promise<void> {
	await setStorageItem(getRouteKey(route.id), JSON.stringify(route));
	const ids = await getRouteIds();
	if (!ids.includes(route.id)) {
		ids.push(route.id);
		await setStorageItem(ROUTES_INDEX_KEY, JSON.stringify(ids));
	}
}

export async function loadRoutes(): Promise<SavedRoute[]> {
	const ids = await getRouteIds();
	const routes: SavedRoute[] = [];
	for (const id of ids) {
		try {
			const raw = await getStorageItem(getRouteKey(id));
			if (raw === null) continue;
			const parsed = JSON.parse(raw);
			if (isValidRoute(parsed)) {
				routes.push(migrateRoute(parsed));
			}
		} catch {
			// Skip corrupted entries
		}
	}
	// Sort by createdAt descending (newest first)
	routes.sort((a, b) => b.createdAt - a.createdAt);
	return routes;
}

export async function loadRoute(id: string): Promise<SavedRoute | null> {
	try {
		const raw = await getStorageItem(getRouteKey(id));
		if (raw === null) return null;
		const parsed = JSON.parse(raw);
		return isValidRoute(parsed) ? migrateRoute(parsed) : null;
	} catch {
		return null;
	}
}

export async function deleteRoute(id: string): Promise<void> {
	try {
		await removeStorageItem(getRouteKey(id));
		const ids = await getRouteIds();
		const filtered = ids.filter((existingId) => existingId !== id);
		if (filtered.length !== ids.length) {
			await setStorageItem(ROUTES_INDEX_KEY, JSON.stringify(filtered));
		}
	} catch {
		// Ignore errors
	}
}

export async function deleteAllRoutes(): Promise<void> {
	try {
		const ids = await getRouteIds();
		for (const id of ids) {
			await removeStorageItem(getRouteKey(id));
		}
		await removeStorageItem(ROUTES_INDEX_KEY);
	} catch {
		// Ignore errors
	}
}
