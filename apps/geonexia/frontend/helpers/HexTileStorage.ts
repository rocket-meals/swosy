import { File, Paths } from 'expo-file-system';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Persistent record for a single H3 hex tile, tracking visit and enclosure history.
 *
 * `level` is a computed 0–3 score that drives the map colour range:
 *   0 = unvisited / never enclosed  → transparent
 *   1 = lightly visited or enclosed  → light green
 *   2 = moderately visited or enclosed → medium green
 *   3 = frequently visited or enclosed → strong green
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
	/** Colour level 0–3, recomputed after each update */
	level: number;
	/**
	 * Whether the user has physically walked on this tile (i.e. GPS tracked).
	 * Tiles that are only enclosed (but not walked on) remain false.
	 */
	walkedOn: boolean;
	/**
	 * Edge crossing counts accumulated across all runs.
	 * Key = neighbouring H3 cell index; value = number of times that shared
	 * border was crossed (entry + exit combined) across all recorded runs.
	 * Used to render the sandy walk-path overlay on the map.
	 */
	edgeCrossings: Record<string, number>;
};

// ─── Level computation ────────────────────────────────────────────────────────

/**
 * Compute the colour level (0–3) for a hex tile based on its visit and
 * enclosure counts. The level is determined by whichever count is higher,
 * so that both visiting and enclosing a tile independently progress its colour.
 *
 * score = max(visitCount, enclosedCount)
 *
 * Thresholds:
 *   score 0          → level 0 (transparent)
 *   score 1–3        → level 1 (light green)
 *   score 4–9        → level 2 (medium green)
 *   score 10+        → level 3 (strong green)
 */
export function computeHexTileLevel(record: Pick<HexTileRecord, 'visitCount' | 'enclosedCount'>): number {
	const score = Math.max(record.visitCount, record.enclosedCount);
	if (score >= 10) return 3;
	if (score >= 4) return 2;
	if (score >= 1) return 1;
	return 0;
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
