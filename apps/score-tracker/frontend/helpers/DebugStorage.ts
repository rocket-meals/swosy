import { getStorageItem, setStorageItem } from 'repo-depkit-common-ui';

export type DebugLogEntry = { timestamp: number; message: string };

export type DebugState = {
	debugMode: boolean;
	logs: DebugLogEntry[];
};

const DEFAULT_DEBUG_STATE: DebugState = {
	debugMode: false,
	logs: [],
};

const DEBUG_KEY = 'score-tracker-debug.json';

/**
 * Persist debug mode + the captured log entries to disk, so a log written while
 * reproducing a hard-to-catch production bug survives an app restart (or a crash)
 * until the user opens Settings to inspect/copy it.
 */
export async function saveDebugState(state: DebugState): Promise<void> {
	try {
		await setStorageItem(DEBUG_KEY, JSON.stringify(state));
	} catch (err) {
		console.warn('[DebugStorage] Failed to save debug state:', err);
	}
}

/**
 * Load the persisted debug state from disk, falling back to defaults.
 */
export async function loadDebugState(): Promise<DebugState> {
	try {
		const raw = await getStorageItem(DEBUG_KEY);
		if (raw === null) return DEFAULT_DEBUG_STATE;
		const parsed = JSON.parse(raw) as Partial<DebugState>;
		return {
			debugMode: typeof parsed.debugMode === 'boolean' ? parsed.debugMode : DEFAULT_DEBUG_STATE.debugMode,
			logs: Array.isArray(parsed.logs) ? parsed.logs : DEFAULT_DEBUG_STATE.logs,
		};
	} catch {
		return DEFAULT_DEBUG_STATE;
	}
}
