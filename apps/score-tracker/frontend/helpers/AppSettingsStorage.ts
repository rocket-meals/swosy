import { File, Paths } from 'expo-file-system';

/** Number of scoreboard columns. Currently only 1 or 2 are offered in the settings UI. */
export type ColumnsCount = 1 | 2;

export type AppSettingsState = {
	columnsPortrait: ColumnsCount;
	columnsLandscape: ColumnsCount;
};

const DEFAULT_APP_SETTINGS: AppSettingsState = {
	columnsPortrait: 1,
	columnsLandscape: 2,
};

function getAppSettingsFile(): File {
	return new File(Paths.document, 'score-tracker-app-settings.json');
}

function normalizeColumnsCount(value: unknown, fallback: ColumnsCount): ColumnsCount {
	return value === 1 || value === 2 ? value : fallback;
}

/**
 * Persist app settings (e.g. the scoreboard columns layout) to disk.
 */
export function saveAppSettings(settings: AppSettingsState): void {
	try {
		getAppSettingsFile().write(JSON.stringify(settings));
	} catch (err) {
		console.warn('[AppSettingsStorage] Failed to save app settings:', err);
	}
}

/**
 * Load persisted app settings from disk, falling back to defaults.
 */
export async function loadAppSettings(): Promise<AppSettingsState> {
	try {
		const file = getAppSettingsFile();
		if (!file.exists) return DEFAULT_APP_SETTINGS;
		const content = await file.text();
		const parsed = JSON.parse(content) as Partial<AppSettingsState>;
		return {
			columnsPortrait: normalizeColumnsCount(parsed.columnsPortrait, DEFAULT_APP_SETTINGS.columnsPortrait),
			columnsLandscape: normalizeColumnsCount(parsed.columnsLandscape, DEFAULT_APP_SETTINGS.columnsLandscape),
		};
	} catch {
		return DEFAULT_APP_SETTINGS;
	}
}
