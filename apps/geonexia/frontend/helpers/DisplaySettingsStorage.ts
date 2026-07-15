import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import { DISPLAY_SETTINGS_DEFAULTS, DisplaySettingsState } from '../store/displaySettingsSlice';

const DISPLAY_SETTINGS_KEY = 'geonexia-display-settings.json';

/**
 * Persist the display settings to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export async function saveDisplaySettings(settings: DisplaySettingsState): Promise<void> {
	try {
		await setStorageItem(DISPLAY_SETTINGS_KEY, JSON.stringify(settings));
	} catch (err) {
		console.warn('[DisplaySettingsStorage] Failed to save display settings:', err);
	}
}

/**
 * Load persisted display settings from disk.
 * Returns defaults when no file exists or on parse errors.
 */
export async function loadDisplaySettings(): Promise<DisplaySettingsState> {
	try {
		const raw = await getStorageItem(DISPLAY_SETTINGS_KEY);
		if (raw === null) return { ...DISPLAY_SETTINGS_DEFAULTS };
		const parsed = JSON.parse(raw) as Partial<DisplaySettingsState>;
		// Merge with defaults so that newly added fields get sensible values
		return { ...DISPLAY_SETTINGS_DEFAULTS, ...parsed };
	} catch {
		return { ...DISPLAY_SETTINGS_DEFAULTS };
	}
}
