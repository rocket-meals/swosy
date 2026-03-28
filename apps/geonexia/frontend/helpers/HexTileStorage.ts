import { File, Paths } from 'expo-file-system';

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
	 */
	billboardAnchorColor?: string | null;
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
