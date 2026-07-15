import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';

export type ThemeMode = 'light' | 'dark' | 'systematic';

const THEME_KEY = 'geonexia-theme.json';

/**
 * Persist the selected theme mode to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export async function saveThemeMode(mode: ThemeMode): Promise<void> {
	try {
		await setStorageItem(THEME_KEY, JSON.stringify({ mode }));
	} catch (err) {
		console.warn('[ThemeStorage] Failed to save theme mode:', err);
	}
}

/**
 * Load the persisted theme mode from disk.
 * Returns 'systematic' as the default when no file exists or on parse errors.
 */
export async function loadThemeMode(): Promise<ThemeMode> {
	try {
		const raw = await getStorageItem(THEME_KEY);
		if (raw === null) return 'systematic';
		const parsed = JSON.parse(raw) as { mode?: ThemeMode };
		const mode = parsed.mode;
		if (mode === 'light' || mode === 'dark' || mode === 'systematic') return mode;
		return 'systematic';
	} catch {
		return 'systematic';
	}
}
