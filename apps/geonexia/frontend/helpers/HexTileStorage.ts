import { File, Paths } from 'expo-file-system';

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Anchor positions within a hex cell for billboard placement.
 * Each value corresponds to a specific geographic position inside the cell:
 * - Purple: hex centroid (center)
 * - Green: vertex[0] (topmost corner in pointy-top orientation)
 * - Red, Orange, Yellow, Blue, White, Black: midpoints between the center
 *   and each of the six vertices (cycling clockwise from vertex[0])
 */
export enum BillboardAnchorColor {
	Purple = 'purple',
	Green = 'green',
	Red = 'red',
	Orange = 'orange',
	Yellow = 'yellow',
	Blue = 'blue',
	White = 'white',
	Black = 'black',
}

/**
 * A back-reference linking a hex tile to a specific activity that visited or
 * enclosed it.  At most one entry per activity is stored per tile.
 *
 * - `walkedIndex`   – index of this tile in the activity's `computed.hexTilesVisited` list
 * - `enclosedIndex` – index of this tile in the activity's `computed.enclosedHexTiles` list
 *
 * One reference object can carry both indices when the tile was both walked and
 * enclosed in the same activity (rare, but possible with self-crossing routes).
 */
export type ActivityReference = {
	activityId: string;
	/** Position in the activity's ordered hex tile sequence, if the tile was visited. */
	walkedIndex?: number;
	/** Position in the activity's enclosed hex tile list, if the tile was enclosed. */
	enclosedIndex?: number;
};

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Persistent record for a single H3 hex tile, tracking visit and enclosure history.
 *
 * `level` is a computed 0–10 score that drives the map colour gradient:
 *   0  = unvisited / never enclosed  → transparent
 *   1  = lightest green (e.g. enclosed once)
 *   10 = darkest green  (e.g. visited 5+ times)
 *
 * Formula: level = min(10, visitCount * 2 + enclosedCount)
 */
export type HexTileRecord = {
	/** H3 cell index (e.g. "89283082813ffff") */
	h3Index: string;
	/** Unix timestamp (ms) of the last time the user passed through this tile */
	lastVisitedAt: number | null;
	/** Unix timestamp (ms) of the last time this tile was enclosed by a run loop */
	lastEnclosedAt: number | null;
	/** Total number of runs where the user visited this tile */
	visitCount: number;
	/** Total number of times this tile was enclosed by a completed run loop */
	enclosedCount: number;
	/** Colour level 0–10, recomputed after each update */
	level: number;
	/**
	 * Whether the user has physically walked on this tile (i.e. GPS tracked).
	 * Tiles that are only enclosed (but not walked on) remain false.
	 */
	walkedOn: boolean;
	/**
	 * Key of the selected terrain tile image (e.g. "Grass/grass_01").
	 * Null or undefined means no custom tile image.
	 */
	tileImage?: string | null;
	/**
	 * Key of the selected billboard placed on this tile (e.g. "tree").
	 * Billboards are upright 2-D sprites rendered as map markers.
	 * Null or undefined means no billboard.
	 */
	billboard?: string | null;
	/**
	 * Anchor color for billboard placement within the hex cell.
	 * Determines where the billboard is positioned:
	 * - 'purple' (default): hex centroid (center)
	 * - 'green': nearest vertex (corner)
	 * - 'red' | 'orange' | 'yellow' | 'blue' | 'white' | 'black': midpoint positions
	 * @deprecated Use `billboards` instead. Kept for backward compatibility.
	 */
	billboardAnchorColor?: string | null;
	/**
	 * Per-anchor billboard map. Keys are BillboardAnchorColor values.
	 * Each key maps to a billboard key (e.g. "objects:47") or null.
	 * When present, this field takes precedence over the legacy `billboard` and
	 * `billboardAnchorColor` fields, allowing multiple billboards on one tile.
	 */
	billboards?: Record<string, string | null>;
	/**
	 * Back-references to the activities that contributed to this tile's
	 * visit/enclosure counts.  There is at most one entry per activity.
	 * Used by the map-rebuild helper to recompute counts from activity history
	 * without re-processing raw GPS points.
	 * Optional for backward-compat with older saves.
	 */
	activityReferences?: ActivityReference[];
};

// ─── Level computation ────────────────────────────────────────────────────────

/**
 * Compute the colour level (0–10) for a hex tile based on its visit and
 * enclosure counts.
 *
 * Formula: level = min(10, visitCount * 2 + enclosedCount)
 *
 *   0  = unvisited / never enclosed (transparent)
 *   1  = lightest green (e.g. enclosed once, never walked)
 *   10 = darkest green  (e.g. visited 5 times)
 *
 * Visiting a tile contributes twice as much as being enclosed, so active
 * running has more visual impact than passive territory capture.
 */
export function computeHexTileLevel(record: Pick<HexTileRecord, 'visitCount' | 'enclosedCount'>): number {
	const score = record.visitCount * 2 + record.enclosedCount;
	if (score <= 0) return 0;
	return Math.min(10, score);
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function getHexTileFile(): File {
	return new File(Paths.document, 'geonexia-hex-tiles.json');
}

function getDevHexTileFile(): File {
	return new File(Paths.document, 'geonexia-dev-hex-tiles.json');
}

function getDevModeFlagFile(): File {
	return new File(Paths.document, 'geonexia-dev-mode.json');
}

function getWalkedEdgesFile(): File {
	return new File(Paths.document, 'geonexia-walked-edges.json');
}

function getDevWalkedEdgesFile(): File {
	return new File(Paths.document, 'geonexia-dev-walked-edges.json');
}

/**
 * Persist the full hex tile record map to disk (synchronous write).
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export function saveHexTileState(records: Record<string, HexTileRecord>): void {
	try {
		getHexTileFile().write(JSON.stringify(records));
	} catch (err) {
		console.warn('[HexTileStorage] Failed to save hex tile state:', err);
	}
}

/**
 * Load hex tile records from disk. Returns an empty object when the file does
 * not yet exist or cannot be parsed.
 */
export async function loadHexTileState(): Promise<Record<string, HexTileRecord>> {
	try {
		const file = getHexTileFile();
		if (!file.exists) return {};
		const content = await file.text();
		return JSON.parse(content) as Record<string, HexTileRecord>;
	} catch {
		return {};
	}
}

/**
 * Persist the dev-mode hex tile record map to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export function saveDevHexTileState(records: Record<string, HexTileRecord>): void {
	try {
		getDevHexTileFile().write(JSON.stringify(records));
	} catch (err) {
		console.warn('[HexTileStorage] Failed to save dev hex tile state:', err);
	}
}

/**
 * Load dev-mode hex tile records from disk. Returns an empty object when the
 * file does not yet exist or cannot be parsed.
 */
export async function loadDevHexTileState(): Promise<Record<string, HexTileRecord>> {
	try {
		const file = getDevHexTileFile();
		if (!file.exists) return {};
		const content = await file.text();
		return JSON.parse(content) as Record<string, HexTileRecord>;
	} catch {
		return {};
	}
}

/**
 * Persist the walked edges array to disk (synchronous write).
 * Each edge is stored as "cellA:cellB" with the lexicographically smaller
 * index first so duplicate edges are naturally deduplicated.
 * Silently ignores write errors.
 */
export function saveWalkedEdges(edges: string[]): void {
	try {
		getWalkedEdgesFile().write(JSON.stringify(edges));
	} catch (err) {
		console.warn('[HexTileStorage] Failed to save walked edges:', err);
	}
}

/**
 * Load walked edges from disk. Returns an empty array when the file does
 * not yet exist or cannot be parsed.
 */
export async function loadWalkedEdges(): Promise<string[]> {
	try {
		const file = getWalkedEdgesFile();
		if (!file.exists) return [];
		const content = await file.text();
		return JSON.parse(content) as string[];
	} catch {
		return [];
	}
}

/**
 * Persist the dev-mode walked edges array to disk.
 * Silently ignores write errors.
 */
export function saveDevWalkedEdges(edges: string[]): void {
	try {
		getDevWalkedEdgesFile().write(JSON.stringify(edges));
	} catch (err) {
		console.warn('[HexTileStorage] Failed to save dev walked edges:', err);
	}
}

/**
 * Load dev-mode walked edges from disk. Returns an empty array when the file
 * does not yet exist or cannot be parsed.
 */
export async function loadDevWalkedEdges(): Promise<string[]> {
	try {
		const file = getDevWalkedEdgesFile();
		if (!file.exists) return [];
		const content = await file.text();
		return JSON.parse(content) as string[];
	} catch {
		return [];
	}
}

/**
 * Persist the dev-mode active flag to disk.
 * Silently ignores write errors.
 */
export function saveDevModeFlag(isDevMode: boolean): void {
	try {
		getDevModeFlagFile().write(JSON.stringify({ active: isDevMode }));
	} catch (err) {
		console.warn('[HexTileStorage] Failed to save dev mode flag:', err);
	}
}

/**
 * Load the dev-mode active flag from disk. Returns false when the file does
 * not yet exist or cannot be parsed.
 */
export async function loadDevModeFlag(): Promise<boolean> {
	try {
		const file = getDevModeFlagFile();
		if (!file.exists) return false;
		const content = await file.text();
		const data = JSON.parse(content) as { active?: boolean };
		return data.active === true;
	} catch {
		return false;
	}
}

// ─── Debug mode flag ──────────────────────────────────────────────────────────

function getDebugModeFlagFile(): File {
	return new File(Paths.document, 'geonexia-debug-mode.json');
}

/**
 * Persist the debug mode active flag to disk.
 * Silently ignores write errors.
 */
export function saveDebugModeFlag(isDebugMode: boolean): void {
	try {
		getDebugModeFlagFile().write(JSON.stringify({ active: isDebugMode }));
	} catch (err) {
		console.warn('[HexTileStorage] Failed to save debug mode flag:', err);
	}
}

/**
 * Load the debug mode active flag from disk. Returns false when the file does
 * not yet exist or cannot be parsed.
 */
export async function loadDebugModeFlag(): Promise<boolean> {
	try {
		const file = getDebugModeFlagFile();
		if (!file.exists) return false;
		const content = await file.text();
		const data = JSON.parse(content) as { active?: boolean };
		return data.active === true;
	} catch {
		return false;
	}
}
