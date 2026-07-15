import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';

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

const APP_SETTINGS_KEY = 'score-tracker-app-settings.json';

function normalizeColumnsCount(value: unknown, fallback: ColumnsCount): ColumnsCount {
	return value === 1 || value === 2 ? value : fallback;
}

/**
 * Persist app settings (e.g. the scoreboard columns layout) to disk.
 */
export async function saveAppSettings(settings: AppSettingsState): Promise<void> {
	try {
		await setStorageItem(APP_SETTINGS_KEY, JSON.stringify(settings));
	} catch (err) {
		console.warn('[AppSettingsStorage] Failed to save app settings:', err);
	}
}

/**
 * Load persisted app settings from disk, falling back to defaults.
 */
export async function loadAppSettings(): Promise<AppSettingsState> {
	try {
		const raw = await getStorageItem(APP_SETTINGS_KEY);
		if (raw === null) return DEFAULT_APP_SETTINGS;
		const parsed = JSON.parse(raw) as Partial<AppSettingsState>;
		return {
			columnsPortrait: normalizeColumnsCount(parsed.columnsPortrait, DEFAULT_APP_SETTINGS.columnsPortrait),
			columnsLandscape: normalizeColumnsCount(parsed.columnsLandscape, DEFAULT_APP_SETTINGS.columnsLandscape),
		};
	} catch {
		return DEFAULT_APP_SETTINGS;
	}
}
