import { File, Paths } from 'expo-file-system';
import type { MapFeatureInfo } from './RouteNameSuggestionHelper';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A cache mapping H3 cell indices to the map features queried for that tile.
 * Storing this on disk avoids repeated network requests to the tile server
 * when the same hex tile is visited across multiple sessions (e.g. for route
 * name suggestions and forest detection during map rebuild).
 */
export type HexTileFeatureCache = Record<string, MapFeatureInfo[]>;

// ─── Storage file ─────────────────────────────────────────────────────────────

function getHexTileFeatureCacheFile(): File {
	return new File(Paths.document, 'geonexia-hex-tile-features.json');
}

// ─── Persistence ─────────────────────────────────────────────────────────────

/**
 * Persist the hex-tile feature cache to disk (synchronous write).
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export function saveHexTileFeatureCache(cache: HexTileFeatureCache): void {
	try {
		getHexTileFeatureCacheFile().write(JSON.stringify(cache));
	} catch (err) {
		console.warn('[HexTileFeatureStorage] Failed to save feature cache:', err);
	}
}

/**
 * Load the hex-tile feature cache from disk.
 * Returns an empty object when the file does not yet exist or cannot be parsed.
 */
export async function loadHexTileFeatureCache(): Promise<HexTileFeatureCache> {
	try {
		const file = getHexTileFeatureCacheFile();
		if (!file.exists) return {};
		const content = await file.text();
		return JSON.parse(content) as HexTileFeatureCache;
	} catch {
		return {};
	}
}

/**
 * Merge new entries into the persisted cache.
 * Existing entries for the same hex ID are overwritten.
 * Returns the updated cache.
 */
export async function mergeHexTileFeatureCache(
	newEntries: HexTileFeatureCache,
): Promise<HexTileFeatureCache> {
	const existing = await loadHexTileFeatureCache();
	const merged: HexTileFeatureCache = { ...existing, ...newEntries };
	saveHexTileFeatureCache(merged);
	return merged;
}
