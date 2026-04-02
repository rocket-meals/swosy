import { File, Paths } from 'expo-file-system';
import { DISPLAY_SETTINGS_DEFAULTS, DisplaySettingsState } from '../store/displaySettingsSlice';

function getDisplaySettingsFile(): File {
	return new File(Paths.document, 'geonexia-display-settings.json');
}

/**
 * Persist the display settings to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export function saveDisplaySettings(settings: DisplaySettingsState): void {
	try {
		getDisplaySettingsFile().write(JSON.stringify(settings));
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
		const file = getDisplaySettingsFile();
		if (!file.exists) return { ...DISPLAY_SETTINGS_DEFAULTS };
		const content = await file.text();
		const parsed = JSON.parse(content) as Partial<DisplaySettingsState>;
		// Merge with defaults so that newly added fields get sensible values
		return { ...DISPLAY_SETTINGS_DEFAULTS, ...parsed };
	} catch {
		return { ...DISPLAY_SETTINGS_DEFAULTS };
	}
}
