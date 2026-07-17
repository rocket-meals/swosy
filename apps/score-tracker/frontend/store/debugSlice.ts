import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { DebugLogEntry } from '../helpers/DebugStorage';
export type { DebugLogEntry };

// ─── State type ───────────────────────────────────────────────────────────────

export type DebugSliceState = {
	debugMode: boolean;
	logs: DebugLogEntry[];
};

const initialState: DebugSliceState = {
	debugMode: false,
	logs: [],
};

// Oldest entries are dropped once the log exceeds this size, so a long debug
// session (or a repro loop) can't grow the persisted log without bound.
const MAX_LOG_ENTRIES = 300;

// ─── Slice ────────────────────────────────────────────────────────────────────

const debugSlice = createSlice({
	name: 'debug',
	initialState,
	reducers: {
		/** Load persisted debug mode + logs from disk. Called once at startup. */
		loadDebugState(state, action: PayloadAction<DebugSliceState>) {
			state.debugMode = action.payload.debugMode;
			state.logs = action.payload.logs;
		},

		setDebugMode(state, action: PayloadAction<boolean>) {
			state.debugMode = action.payload;
		},

		addDebugLog: {
			reducer(state, action: PayloadAction<DebugLogEntry>) {
				state.logs.push(action.payload);
				if (state.logs.length > MAX_LOG_ENTRIES) {
					state.logs.splice(0, state.logs.length - MAX_LOG_ENTRIES);
				}
			},
			prepare(message: string) {
				return { payload: { timestamp: Date.now(), message } };
			},
		},

		clearDebugLogs(state) {
			state.logs = [];
		},
	},
});

export const { loadDebugState, setDebugMode, addDebugLog, clearDebugLogs } = debugSlice.actions;
export default debugSlice.reducer;
