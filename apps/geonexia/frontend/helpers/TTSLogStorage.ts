import { getStorageItem, setStorageItem, removeStorageItem } from 'repo-depkit-common-ui';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Fields describing a piece of spoken text: what was said, in which language,
 * and where the announcement originated from. Shared between the in-memory
 * `QueueItem` (`AudioQueueHelper.ts`) and the persisted `TTSLogEntry`.
 */
export type SpokenTextFields = {
	/** The text that was to be spoken */
	text: string;
	/** Language code passed to expo-speech */
	languageCode: string;
	/** Label describing the source of the announcement (e.g. "km_milestone", "periodic", "pace_hint", "background") */
	source: string;
};

/**
 * A single TTS log entry capturing what was spoken (or attempted) and whether
 * it succeeded.
 */
export type TTSLogEntry = SpokenTextFields & {
	/** Unix timestamp (ms) when the speech attempt occurred */
	timestamp: number;
	/** Whether the speech call succeeded */
	success: boolean;
	/** Error message if the speech call failed */
	error?: string;
};

// ─── Storage ──────────────────────────────────────────────────────────────────

/** Maximum number of log entries to keep in storage to avoid unbounded growth. */
const MAX_LOG_ENTRIES = 500;

const LOG_KEY = 'geonexia-tts-log.json';

/**
 * Load all TTS log entries from disk. Returns an empty array when the file does
 * not yet exist or cannot be parsed.
 */
export async function loadTTSLog(): Promise<TTSLogEntry[]> {
	try {
		const raw = await getStorageItem(LOG_KEY);
		if (raw === null) return [];
		const entries = JSON.parse(raw);
		if (!Array.isArray(entries)) return [];
		return entries as TTSLogEntry[];
	} catch {
		return [];
	}
}

/**
 * Append a single TTS log entry to disk. Older entries beyond
 * {@link MAX_LOG_ENTRIES} are trimmed.
 * Silently ignores write errors.
 */
export async function appendTTSLogEntry(entry: TTSLogEntry): Promise<void> {
	try {
		const existing = await loadTTSLog();
		existing.push(entry);
		// Keep only the newest entries to avoid unbounded growth.
		const trimmed = existing.length > MAX_LOG_ENTRIES
			? existing.slice(existing.length - MAX_LOG_ENTRIES)
			: existing;
		await setStorageItem(LOG_KEY, JSON.stringify(trimmed));
	} catch (err) {
		console.warn('[TTSLogStorage] Failed to append log entry:', err);
	}
}

/**
 * Clear all TTS log entries from disk.
 * Silently ignores errors.
 */
export async function clearTTSLog(): Promise<void> {
	try {
		await removeStorageItem(LOG_KEY);
	} catch (err) {
		console.warn('[TTSLogStorage] Failed to clear TTS log:', err);
	}
}
