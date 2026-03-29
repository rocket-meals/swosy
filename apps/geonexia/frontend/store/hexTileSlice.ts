import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HexTileRecord, BillboardAnchorColor, computeHexTileLevel } from '../helpers/HexTileStorage';

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
		 * Each tile is dispatched at most once per run (enforced in the recording
		 * screen), so visitCount increases by at most 1 per run.
		 * The level cap of startLevel + 1 additionally ensures a tile can never
		 * rise by more than one step within a single activity.
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
				rec.level = Math.min(newLevel, startLevel + 1);
			}
		},

		/**
		 * Record that the given tiles were enclosed by a completed run loop.
		 * The level cap of startLevel + 1 ensures that even combined visit +
		 * enclosure bonuses cannot push a tile up more than one step per run.
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
				rec.level = Math.min(newLevel, startLevel + 1);
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

		/**
		 * Set the custom tile image and/or billboard for a specific hex tile.
		 * Pass `null` to explicitly clear a value; omit the key to leave it unchanged.
		 * @deprecated Prefer `setBillboardAtAnchor` for billboard changes.
		 */
		setHexTileCustomization(
			state,
			action: PayloadAction<{ h3Index: string; tileImage?: string | null; billboard?: string | null; billboardAnchorColor?: string | null }>,
		) {
			const { h3Index, tileImage, billboard, billboardAnchorColor } = action.payload;
			const rec = getOrCreate(state.records, h3Index);
			if (tileImage !== undefined) rec.tileImage = tileImage;
			if (billboard !== undefined) rec.billboard = billboard;
			if (billboardAnchorColor !== undefined) rec.billboardAnchorColor = billboardAnchorColor;
		},

		/**
		 * Set or clear the billboard at a specific anchor position on a hex tile.
		 * Migrates the legacy `billboard`/`billboardAnchorColor` fields into the
		 * `billboards` map the first time this action is dispatched for a tile.
		 */
		setBillboardAtAnchor(
			state,
			action: PayloadAction<{ h3Index: string; anchorColor: BillboardAnchorColor; billboard: string | null }>,
		) {
			const { h3Index, anchorColor, billboard } = action.payload;
			const rec = getOrCreate(state.records, h3Index);
			if (!rec.billboards) {
				rec.billboards = {};
				// Migrate legacy single-billboard field if present
				if (rec.billboard) {
					const legacyAnchor = rec.billboardAnchorColor ?? BillboardAnchorColor.Purple;
					rec.billboards[legacyAnchor] = rec.billboard;
				}
			}
			if (billboard === null) {
				delete rec.billboards[anchorColor];
			} else {
				rec.billboards[anchorColor] = billboard;
			}
		},

		/**
		 * Apply map customizations (tileImage, billboards) to the tile records,
		 * merging the provided data into the existing state. Useful for importing
		 * map settings without overwriting activity tracking data.
		 */
		applyMapCustomizations(
			state,
			action: PayloadAction<Record<string, { tileImage?: string | null; billboards?: Record<string, string | null> }>>,
		) {
			for (const [h3Index, customization] of Object.entries(action.payload)) {
				const rec = getOrCreate(state.records, h3Index);
				if (customization.tileImage !== undefined) rec.tileImage = customization.tileImage;
				if (customization.billboards !== undefined) rec.billboards = customization.billboards;
			}
		},
	},
});

export const { startRun, markVisited, markEnclosed, loadPersistedState, setHexTileCustomization, setBillboardAtAnchor, applyMapCustomizations } = hexTileSlice.actions;
export default hexTileSlice.reducer;
