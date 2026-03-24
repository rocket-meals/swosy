import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HexTileRecord, computeHexTileLevel } from '../helpers/HexTileStorage';

// ─── State type ───────────────────────────────────────────────────────────────

export type HexTileSliceState = {
	/** Map of H3 index → persistent record */
	records: Record<string, HexTileRecord>;
	/** Snapshot of tile levels at the start of the current run (transient, not persisted) */
	runStartLevels: Record<string, number>;
	/**
	 * Monotonically increasing counter that is bumped on every full data reset.
	 * Screens can watch this value to detect resets and refresh their map views.
	 */
	resetToken: number;
};

const initialState: HexTileSliceState = {
	records: {},
	runStartLevels: {},
	resetToken: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreate(records: Record<string, HexTileRecord>, h3Index: string): HexTileRecord {
	if (!records[h3Index]) {
		records[h3Index] = {
			h3Index,
			lastVisitedAt: null,
			lastEnclosedAt: null,
			visitCount: 0,
			enclosedCount: 0,
			level: 0,
			walkedOn: false,
		};
	}
	return records[h3Index];
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const hexTileSlice = createSlice({
	name: 'hexTiles',
	initialState,
	reducers: {
		/**
		 * Snapshot the current tile levels at the start of a run.
		 * Used to ensure the tile level can increase by at most 1 per run.
		 */
		startRun(state) {
			state.runStartLevels = {};
			for (const [h3Index, rec] of Object.entries(state.records)) {
				state.runStartLevels[h3Index] = rec.level;
			}
		},

		/**
		 * Record that the user visited the given tiles during a run.
		 * Called once per GPS update for each newly visited cell.
		 */
		markVisited(
			state,
			action: PayloadAction<{ h3Indices: string[]; timestamp: number }>,
		) {
			const { h3Indices, timestamp } = action.payload;
			for (const h3Index of h3Indices) {
				const rec = getOrCreate(state.records, h3Index);
				rec.lastVisitedAt = timestamp;
				rec.visitCount += 1;
				rec.walkedOn = true;
				const newLevel = computeHexTileLevel(rec);
				const startLevel = state.runStartLevels[h3Index] ?? 0;
				rec.level = Math.min(newLevel, startLevel + 2);
			}
		},

		/**
		 * Record that the given tiles were enclosed by a completed run loop.
		 */
		markEnclosed(
			state,
			action: PayloadAction<{ h3Indices: string[]; timestamp: number }>,
		) {
			const { h3Indices, timestamp } = action.payload;
			for (const h3Index of h3Indices) {
				const rec = getOrCreate(state.records, h3Index);
				rec.lastEnclosedAt = timestamp;
				rec.enclosedCount += 1;
				const newLevel = computeHexTileLevel(rec);
				const startLevel = state.runStartLevels[h3Index] ?? 0;
				rec.level = Math.min(newLevel, startLevel + 2);
			}
		},

		/**
		 * Replace the entire state with data loaded from persistent storage.
		 * Called once at app startup and again after a full data reset.
		 * Bumps `resetToken` on every call so that the record screen can detect
		 * resets and reload the map with fresh (empty) tile data.
		 */
		loadPersistedState(
			state,
			action: PayloadAction<Record<string, HexTileRecord>>,
		) {
			state.records = action.payload;
			state.resetToken += 1;
		},
	},
});

export const { startRun, markVisited, markEnclosed, loadPersistedState } = hexTileSlice.actions;
export default hexTileSlice.reducer;
