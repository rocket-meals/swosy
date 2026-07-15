import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import type { SportType } from '../store/sportTypeSlice';

const SPORT_TYPE_KEY = 'geonexia-sport-type.json';

/**
 * Persist the selected sport type to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export async function saveSportType(type: SportType): Promise<void> {
	try {
		await setStorageItem(SPORT_TYPE_KEY, JSON.stringify({ type }));
	} catch (err) {
		console.warn('[SportTypeStorage] Failed to save sport type:', err);
	}
}

/**
 * Load the persisted sport type from disk.
 * Returns 'run' as the default when no file exists or on parse errors.
 */
export async function loadSportType(): Promise<SportType> {
	try {
		const raw = await getStorageItem(SPORT_TYPE_KEY);
		if (raw === null) return 'run';
		const parsed = JSON.parse(raw) as { type?: SportType };
		return parsed.type ?? 'run';
	} catch {
		return 'run';
	}
}
