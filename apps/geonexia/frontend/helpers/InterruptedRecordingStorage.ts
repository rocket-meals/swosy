import { getStorageItem, setStorageItem, removeStorageItem } from 'repo-depkit-common-ui';
import type { RecordingSessionFields } from './ActivityRouteSharedTypes';
import type { SportType } from '../store/sportTypeSlice';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Snapshot of an in-progress recording session, periodically persisted to disk
 * so that the recording can be recovered after an unexpected app crash.
 *
 * Unlike `SavedActivity`, a snapshot is always written fresh while recording
 * is active, so `sportType`, `h3Resolution` and `hexTilesOrdered` are
 * narrowed back to required here (they are optional on
 * `RecordingSessionFields` for `SavedActivity`'s backward-compat needs).
 */
export type InterruptedRecordingSnapshot = RecordingSessionFields & {
	/** Accumulated seconds before the most recent segment start */
	accumulatedSeconds: number;
	/** Unix timestamp (ms) of the current segment start */
	segmentStart: number;
	/** Ordered sequence of H3 hex tile indices visited so far */
	hexTilesOrdered: string[];
	/** The H3 resolution used during recording */
	h3Resolution: number;
	/** The sport type selected for this recording */
	sportType: SportType;
	/** Timestamp when this snapshot was written */
	savedAt: number;
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const SNAPSHOT_KEY = 'geonexia-interrupted-recording.json';

/**
 * Persist a recording snapshot to disk. Called periodically during recording.
 * Silently ignores write errors.
 */
export async function saveRecordingSnapshot(snapshot: InterruptedRecordingSnapshot): Promise<void> {
	try {
		await setStorageItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
	} catch (err) {
		console.warn('[InterruptedRecordingStorage] Failed to save snapshot:', err);
	}
}

/**
 * Load a previously saved recording snapshot from disk. Returns null when
 * the file does not exist or cannot be parsed.
 */
export async function loadRecordingSnapshot(): Promise<InterruptedRecordingSnapshot | null> {
	try {
		const raw = await getStorageItem(SNAPSHOT_KEY);
		if (raw === null) return null;
		const data = JSON.parse(raw) as InterruptedRecordingSnapshot;
		// Basic validation – a valid snapshot must at least have a startedAt timestamp
		if (typeof data.startedAt !== 'number' || data.startedAt <= 0) return null;
		if (!Array.isArray(data.routePoints)) return null;
		return data;
	} catch {
		return null;
	}
}

/**
 * Delete any saved recording snapshot. Called when a recording is stopped
 * cleanly so that no stale recovery prompt is shown on next launch.
 */
export async function clearRecordingSnapshot(): Promise<void> {
	try {
		await removeStorageItem(SNAPSHOT_KEY);
	} catch (err) {
		console.warn('[InterruptedRecordingStorage] Failed to clear snapshot:', err);
	}
}
