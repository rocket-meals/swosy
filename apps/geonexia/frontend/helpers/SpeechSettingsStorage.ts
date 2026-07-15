import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';
import { SPEECH_SETTINGS_DEFAULTS, SpeechSettingsState } from '../store/speechSettingsSlice';

const SPEECH_SETTINGS_KEY = 'geonexia-speech-settings.json';

/**
 * Persist the full speech settings to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export async function saveSpeechSettings(settings: SpeechSettingsState): Promise<void> {
	try {
		await setStorageItem(SPEECH_SETTINGS_KEY, JSON.stringify(settings));
	} catch (err) {
		console.warn('[SpeechSettingsStorage] Failed to save speech settings:', err);
	}
}

/**
 * Load persisted speech settings from disk.
 * Returns defaults when no file exists or on parse errors.
 */
export async function loadSpeechSettings(): Promise<SpeechSettingsState> {
	try {
		const raw = await getStorageItem(SPEECH_SETTINGS_KEY);
		if (raw === null) return { ...SPEECH_SETTINGS_DEFAULTS };
		const parsed = JSON.parse(raw) as Partial<SpeechSettingsState>;
		// Merge with defaults so that newly added fields get sensible values
		return { ...SPEECH_SETTINGS_DEFAULTS, ...parsed };
	} catch {
		return { ...SPEECH_SETTINGS_DEFAULTS };
	}
}
