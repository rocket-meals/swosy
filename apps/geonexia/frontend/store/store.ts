import { configureStore } from '@reduxjs/toolkit';
import hexTileReducer from './hexTileSlice';
import sportTypeReducer from './sportTypeSlice';
import { HexTileRecord, saveHexTileState } from '../helpers/HexTileStorage';
import { saveSportType } from '../helpers/SportTypeStorage';
import type { SportType } from './sportTypeSlice';

// ─── Store ────────────────────────────────────────────────────────────────────

export const store = configureStore({
	reducer: {
		hexTiles: hexTileReducer,
		sportType: sportTypeReducer,
	},
});

// Auto-persist hex tile state to disk whenever it changes (debounced to avoid
// excessive I/O during rapid consecutive GPS updates).
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
let _lastSavedRecords: Record<string, HexTileRecord> | null = null;

// Auto-persist sport type to disk whenever the selected type changes.
let _lastSavedSportType: SportType | null = null;

store.subscribe(() => {
	const state = store.getState();

	const { records } = state.hexTiles;
	if (records !== _lastSavedRecords) {
		_lastSavedRecords = records;
		if (_saveTimer) clearTimeout(_saveTimer);
		_saveTimer = setTimeout(() => {
			saveHexTileState(records);
			_saveTimer = null;
		}, 500);
	}

	const { selectedType } = state.sportType;
	if (selectedType !== _lastSavedSportType) {
		_lastSavedSportType = selectedType;
		saveSportType(selectedType);
	}
});

// ─── Type helpers ─────────────────────────────────────────────────────────────

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
