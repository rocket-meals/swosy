import { File, Paths } from 'expo-file-system';

export type TTSEnabled = boolean;

function getTTSFile(): File {
	return new File(Paths.document, 'geonexia-tts.json');
}

/**
 * Persist the TTS enabled flag to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export function saveTTSEnabled(enabled: TTSEnabled): void {
	try {
		getTTSFile().write(JSON.stringify({ enabled }));
	} catch (err) {
		console.warn('[TTSStorage] Failed to save TTS enabled flag:', err);
	}
}

/**
 * Load the persisted TTS enabled flag from disk.
 * Returns true as the default when no file exists or on parse errors.
 */
export async function loadTTSEnabled(): Promise<TTSEnabled> {
	try {
		const file = getTTSFile();
		if (!file.exists) return true;
		const content = await file.text();
		const parsed = JSON.parse(content) as { enabled?: TTSEnabled };
		if (typeof parsed.enabled === 'boolean') return parsed.enabled;
		return true;
	} catch {
		return true;
	}
}
