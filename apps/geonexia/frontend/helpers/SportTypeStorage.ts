import { File, Paths } from 'expo-file-system';
import type { SportType } from '../store/sportTypeSlice';

function getSportTypeFile(): File {
	return new File(Paths.document, 'geonexia-sport-type.json');
}

/**
 * Persist the selected sport type to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export function saveSportType(type: SportType): void {
	try {
		getSportTypeFile().write(JSON.stringify({ type }));
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
		const file = getSportTypeFile();
		if (!file.exists) return 'run';
		const content = await file.text();
		const parsed = JSON.parse(content) as { type?: SportType };
		return parsed.type ?? 'run';
	} catch {
		return 'run';
	}
}
