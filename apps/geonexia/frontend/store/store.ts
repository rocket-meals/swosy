import { configureStore } from '@reduxjs/toolkit';
import hexTileReducer from './hexTileSlice';
import { HexTileRecord, saveHexTileState } from '../helpers/HexTileStorage';

// ─── Store ────────────────────────────────────────────────────────────────────

export const store = configureStore({
	reducer: {
		hexTiles: hexTileReducer,
	},
});

// Auto-persist hex tile state to disk whenever it changes (debounced to avoid
// excessive I/O during rapid consecutive GPS updates).
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
let _lastSavedRecords: Record<string, HexTileRecord> | null = null;
store.subscribe(() => {
	const { records } = store.getState().hexTiles;
	if (records === _lastSavedRecords) return;
	_lastSavedRecords = records;
	if (_saveTimer) clearTimeout(_saveTimer);
	_saveTimer = setTimeout(() => {
		saveHexTileState(records);
		_saveTimer = null;
	}, 500);
});

// ─── Type helpers ─────────────────────────────────────────────────────────────

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
