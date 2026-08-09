import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import { AUTO_PAUSE_SETTINGS_DEFAULTS, AutoPauseSettingsState } from '../store/autoPauseSlice';

const AUTO_PAUSE_SETTINGS_KEY = 'geonexia-auto-pause-settings.json';

/**
 * Persist the full auto-pause settings to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export async function saveAutoPauseSettings(settings: AutoPauseSettingsState): Promise<void> {
	try {
		await setStorageItem(AUTO_PAUSE_SETTINGS_KEY, JSON.stringify(settings));
	} catch (err) {
		console.warn('[AutoPauseStorage] Failed to save auto-pause settings:', err);
	}
}

/**
 * Load persisted auto-pause settings from disk.
 * Returns defaults when no file exists or on parse errors.
 */
export async function loadAutoPauseSettings(): Promise<AutoPauseSettingsState> {
	try {
		const raw = await getStorageItem(AUTO_PAUSE_SETTINGS_KEY);
		if (raw === null) return { ...AUTO_PAUSE_SETTINGS_DEFAULTS };
		const parsed = JSON.parse(raw) as Partial<AutoPauseSettingsState>;
		// Merge with defaults so that newly added fields get sensible values
		return { ...AUTO_PAUSE_SETTINGS_DEFAULTS, ...parsed };
	} catch {
		return { ...AUTO_PAUSE_SETTINGS_DEFAULTS };
	}
}
