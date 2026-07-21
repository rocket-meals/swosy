import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';

const TTS_KEY = 'geonexia-tts.json';

/**
 * Persist the TTS enabled flag to disk.
 * Silently ignores write errors to avoid crashing on storage failures.
 */
export async function saveTTSEnabled(enabled: boolean): Promise<void> {
	try {
		await setStorageItem(TTS_KEY, JSON.stringify({ enabled }));
	} catch (err) {
		console.warn('[TTSStorage] Failed to save TTS enabled flag:', err);
	}
}

/**
 * Load the persisted TTS enabled flag from disk.
 * Returns true as the default when no file exists or on parse errors.
 */
export async function loadTTSEnabled(): Promise<boolean> {
	try {
		const raw = await getStorageItem(TTS_KEY);
		if (raw === null) return true;
		const parsed = JSON.parse(raw) as { enabled?: boolean };
		if (typeof parsed.enabled === 'boolean') return parsed.enabled;
		return true;
	} catch {
		return true;
	}
}
