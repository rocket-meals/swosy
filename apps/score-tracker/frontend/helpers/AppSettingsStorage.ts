import { File, Paths } from 'expo-file-system';

export type ColumnsMode = 'single' | 'landscape-2';

export type AppSettingsState = {
	columnsMode: ColumnsMode;
};

const DEFAULT_APP_SETTINGS: AppSettingsState = {
	columnsMode: 'single',
};

function getAppSettingsFile(): File {
	return new File(Paths.document, 'score-tracker-app-settings.json');
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
		const columnsMode: ColumnsMode = parsed.columnsMode === 'landscape-2' ? 'landscape-2' : 'single';
		return { columnsMode };
	} catch {
		return DEFAULT_APP_SETTINGS;
	}
}
