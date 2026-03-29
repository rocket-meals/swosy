import { File, Paths } from 'expo-file-system';
import { SPEECH_SETTINGS_DEFAULTS, SpeechSettingsState } from '../store/speechSettingsSlice';

function getSpeechSettingsFile(): File {
	return new File(Paths.document, 'geonexia-speech-settings.json');
}

/**
 * Persist the full speech settings to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export function saveSpeechSettings(settings: SpeechSettingsState): void {
	try {
		getSpeechSettingsFile().write(JSON.stringify(settings));
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
		const file = getSpeechSettingsFile();
		if (!file.exists) return { ...SPEECH_SETTINGS_DEFAULTS };
		const content = await file.text();
		const parsed = JSON.parse(content) as Partial<SpeechSettingsState>;
		// Merge with defaults so that newly added fields get sensible values
		return { ...SPEECH_SETTINGS_DEFAULTS, ...parsed };
	} catch {
		return { ...SPEECH_SETTINGS_DEFAULTS };
	}
}
