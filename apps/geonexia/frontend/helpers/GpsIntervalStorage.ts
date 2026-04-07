import { File, Paths } from 'expo-file-system';

export const GPS_INTERVAL_DEFAULT_SECONDS = 10;

function getGpsIntervalFile(): File {
	return new File(Paths.document, 'geonexia-gps-interval.json');
}

/**
 * Persist the GPS interval (in seconds) to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export function saveGpsIntervalSeconds(seconds: number): void {
	try {
		getGpsIntervalFile().write(JSON.stringify({ seconds }));
	} catch (err) {
		console.warn('[GpsIntervalStorage] Failed to save GPS interval seconds:', err);
	}
}

/**
 * Load the persisted GPS interval (in seconds) from disk.
 * Returns GPS_INTERVAL_DEFAULT_SECONDS as the fallback when no file exists or on parse errors.
 * Migrates legacy mode-based storage automatically.
 */
export async function loadGpsIntervalSeconds(): Promise<number> {
	try {
		const file = getGpsIntervalFile();
		if (!file.exists) return GPS_INTERVAL_DEFAULT_SECONDS;
		const content = await file.text();
		const parsed = JSON.parse(content) as { seconds?: unknown; mode?: string };
		if (typeof parsed.seconds === 'number' && parsed.seconds > 0) return parsed.seconds;
		// Migrate from legacy mode-based storage
		if (typeof parsed.mode === 'string') {
			switch (parsed.mode) {
				case 'default': return 1;
				case 'energy_saving': return 4;
				case 'high_precision': return 0.5;
			}
		}
		return GPS_INTERVAL_DEFAULT_SECONDS;
	} catch {
		return GPS_INTERVAL_DEFAULT_SECONDS;
	}
}
