import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import { REPLAY_SETTINGS_DEFAULTS, ReplaySettingsState } from '../store/replaySettingsSlice';

const REPLAY_SETTINGS_KEY = 'geonexia-replay-settings.json';

/**
 * Persist the replay settings to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export async function saveReplaySettings(settings: ReplaySettingsState): Promise<void> {
	try {
		await setStorageItem(REPLAY_SETTINGS_KEY, JSON.stringify(settings));
	} catch (err) {
		console.warn('[ReplaySettingsStorage] Failed to save replay settings:', err);
	}
}

/**
 * Load persisted replay settings from disk.
 * Returns defaults when no file exists or on parse errors.
 */
export async function loadReplaySettings(): Promise<ReplaySettingsState> {
	try {
		const raw = await getStorageItem(REPLAY_SETTINGS_KEY);
		if (raw === null) return { ...REPLAY_SETTINGS_DEFAULTS };
		const parsed = JSON.parse(raw) as Partial<ReplaySettingsState>;
		// Merge with defaults so that newly added fields get sensible values
		return { ...REPLAY_SETTINGS_DEFAULTS, ...parsed };
	} catch {
		return { ...REPLAY_SETTINGS_DEFAULTS };
	}
}
