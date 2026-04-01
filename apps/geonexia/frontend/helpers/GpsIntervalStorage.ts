import { File, Paths } from 'expo-file-system';

export type GpsIntervalMode = 'default' | 'energy_saving' | 'high_precision';

/** GPS update interval in milliseconds for each mode. */
export const GPS_INTERVAL_MS: Record<GpsIntervalMode, number> = {
	default: 1000,
	energy_saving: 4000,
	high_precision: 500,
};

function getGpsIntervalFile(): File {
	return new File(Paths.document, 'geonexia-gps-interval.json');
}

/**
 * Persist the selected GPS interval mode to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export function saveGpsIntervalMode(mode: GpsIntervalMode): void {
	try {
		getGpsIntervalFile().write(JSON.stringify({ mode }));
	} catch (err) {
		console.warn('[GpsIntervalStorage] Failed to save GPS interval mode:', err);
	}
}

/**
 * Load the persisted GPS interval mode from disk.
 * Returns 'default' as the fallback when no file exists or on parse errors.
 */
export async function loadGpsIntervalMode(): Promise<GpsIntervalMode> {
	try {
		const file = getGpsIntervalFile();
		if (!file.exists) return 'default';
		const content = await file.text();
		const parsed = JSON.parse(content) as { mode?: GpsIntervalMode };
		const mode = parsed.mode;
		if (mode === 'default' || mode === 'energy_saving' || mode === 'high_precision') return mode;
		return 'default';
	} catch {
		return 'default';
	}
}
