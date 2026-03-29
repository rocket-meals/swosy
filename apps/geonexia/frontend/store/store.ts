import { configureStore } from '@reduxjs/toolkit';
import hexTileReducer from './hexTileSlice';
import sportTypeReducer from './sportTypeSlice';
import themeReducer from './themeSlice';
import billboardConfigReducer from './billboardConfigSlice';
import { HexTileRecord, saveHexTileState, saveDevHexTileState } from '../helpers/HexTileStorage';
import { saveSportType } from '../helpers/SportTypeStorage';
import { saveThemeMode } from '../helpers/ThemeStorage';
import { BillboardConfigState, saveBillboardConfig } from '../helpers/BillboardConfigStorage';
import type { SportType } from './sportTypeSlice';
import type { ThemeMode } from './themeSlice';

// ─── Store ────────────────────────────────────────────────────────────────────

export const store = configureStore({
	reducer: {
		hexTiles: hexTileReducer,
		sportType: sportTypeReducer,
		theme: themeReducer,
		billboardConfig: billboardConfigReducer,
	},
});

// Auto-persist hex tile state to disk whenever it changes (debounced to avoid
// excessive I/O during rapid consecutive GPS updates).
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
let _lastSavedRecords: Record<string, HexTileRecord> | null = null;

// Auto-persist sport type to disk whenever the selected type changes.
let _lastSavedSportType: SportType | null = null;

// Auto-persist theme mode to disk whenever the selected mode changes.
let _lastSavedThemeMode: ThemeMode | null = null;

// Auto-persist billboard config to disk whenever anchor overrides change.
let _bbConfigTimer: ReturnType<typeof setTimeout> | null = null;
let _lastSavedBbConfig: BillboardConfigState | null = null;

store.subscribe(() => {
	const state = store.getState();

	const { records, isDevMode } = state.hexTiles;
	if (records !== _lastSavedRecords) {
		_lastSavedRecords = records;
		if (_saveTimer) clearTimeout(_saveTimer);
		_saveTimer = setTimeout(() => {
			const currentIsDevMode = store.getState().hexTiles.isDevMode;
			if (currentIsDevMode) {
				saveDevHexTileState(records);
			} else {
				saveHexTileState(records);
			}
			_saveTimer = null;
		}, 500);
	}

	const { selectedType } = state.sportType;
	if (selectedType !== _lastSavedSportType) {
		_lastSavedSportType = selectedType;
		saveSportType(selectedType);
	}

	const { selectedMode } = state.theme;
	if (selectedMode !== _lastSavedThemeMode) {
		_lastSavedThemeMode = selectedMode;
		saveThemeMode(selectedMode);
	}

	const { spriteAnchors } = state.billboardConfig;
	if (spriteAnchors !== _lastSavedBbConfig) {
		_lastSavedBbConfig = spriteAnchors;
		if (_bbConfigTimer) clearTimeout(_bbConfigTimer);
		_bbConfigTimer = setTimeout(() => {
			saveBillboardConfig(spriteAnchors);
			_bbConfigTimer = null;
		}, 500);
	}
});

// ─── Type helpers ─────────────────────────────────────────────────────────────

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
