import { File, Paths } from 'expo-file-system';
import { REPLAY_SETTINGS_DEFAULTS, ReplaySettingsState } from '../store/replaySettingsSlice';

function getReplaySettingsFile(): File {
	return new File(Paths.document, 'geonexia-replay-settings.json');
}

/**
 * Persist the replay settings to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export function saveReplaySettings(settings: ReplaySettingsState): void {
	try {
		getReplaySettingsFile().write(JSON.stringify(settings));
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
		const file = getReplaySettingsFile();
		if (!file.exists) return { ...REPLAY_SETTINGS_DEFAULTS };
		const content = await file.text();
		const parsed = JSON.parse(content) as Partial<ReplaySettingsState>;
		// Merge with defaults so that newly added fields get sensible values
		return { ...REPLAY_SETTINGS_DEFAULTS, ...parsed };
	} catch {
		return { ...REPLAY_SETTINGS_DEFAULTS };
	}
}
