import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import gameReducer from './gameSlice';
import friendsReducer from './friendsSlice';
import gameTypesReducer from './gameTypesSlice';
import gameHistoryReducer from './gameHistorySlice';
import appSettingsReducer from './appSettingsSlice';
import debugReducer from './debugSlice';
import { saveThemeMode } from '../helpers/ThemeStorage';
import { saveGameState } from '../helpers/GameStorage';
import { saveFriends } from '../helpers/FriendsStorage';
import { saveGameTypes } from '../helpers/GameTypesStorage';
import { saveGameHistory } from '../helpers/GameHistoryStorage';
import { saveAppSettings } from '../helpers/AppSettingsStorage';
import { saveDebugState } from '../helpers/DebugStorage';
import type { ThemeMode } from './themeSlice';
import type { GameSliceState } from './gameSlice';
import type { FriendsSliceState } from './friendsSlice';
import type { GameTypesSliceState } from './gameTypesSlice';
import type { GameHistorySliceState } from './gameHistorySlice';
import type { AppSettingsSliceState } from './appSettingsSlice';
import type { DebugSliceState } from './debugSlice';

// ─── Store ────────────────────────────────────────────────────────────────────

export const store = configureStore({
	reducer: {
		theme: themeReducer,
		game: gameReducer,
		friends: friendsReducer,
		gameTypes: gameTypesReducer,
		gameHistory: gameHistoryReducer,
		appSettings: appSettingsReducer,
		debug: debugReducer,
	},
});

// ─── Auto-persist ─────────────────────────────────────────────────────────────

let _lastSavedThemeMode: ThemeMode | null = null;
let _gameTimer: ReturnType<typeof setTimeout> | null = null;
let _lastSavedGame: GameSliceState | null = null;
let _friendsTimer: ReturnType<typeof setTimeout> | null = null;
let _lastSavedFriends: FriendsSliceState | null = null;
let _gameTypesTimer: ReturnType<typeof setTimeout> | null = null;
let _lastSavedGameTypes: GameTypesSliceState | null = null;
let _historyTimer: ReturnType<typeof setTimeout> | null = null;
let _lastSavedHistory: GameHistorySliceState | null = null;
let _lastSavedAppSettings: AppSettingsSliceState | null = null;
let _debugTimer: ReturnType<typeof setTimeout> | null = null;
let _lastSavedDebug: DebugSliceState | null = null;

store.subscribe(() => {
	const state = store.getState();

	const { selectedMode } = state.theme;
	if (selectedMode !== _lastSavedThemeMode) {
		_lastSavedThemeMode = selectedMode;
		saveThemeMode(selectedMode);
	}

	const game = state.game;
	if (game !== _lastSavedGame) {
		_lastSavedGame = game;
		if (_gameTimer) clearTimeout(_gameTimer);
		_gameTimer = setTimeout(() => {
			saveGameState({
				players: game.players,
				rounds: game.rounds,
				status: game.status,
				currentRoundIndex: game.currentRoundIndex,
				gameTypeId: game.gameTypeId,
			});
			_gameTimer = null;
		}, 300);
	}

	const friends = state.friends;
	if (friends !== _lastSavedFriends) {
		_lastSavedFriends = friends;
		if (_friendsTimer) clearTimeout(_friendsTimer);
		_friendsTimer = setTimeout(() => {
			saveFriends(friends.friends);
			_friendsTimer = null;
		}, 300);
	}

	const gameTypes = state.gameTypes;
	if (gameTypes !== _lastSavedGameTypes) {
		_lastSavedGameTypes = gameTypes;
		if (_gameTypesTimer) clearTimeout(_gameTypesTimer);
		_gameTypesTimer = setTimeout(() => {
			saveGameTypes(gameTypes.gameTypes);
			_gameTypesTimer = null;
		}, 300);
	}

	const gameHistory = state.gameHistory;
	if (gameHistory !== _lastSavedHistory) {
		_lastSavedHistory = gameHistory;
		if (_historyTimer) clearTimeout(_historyTimer);
		_historyTimer = setTimeout(() => {
			saveGameHistory(gameHistory.entries);
			_historyTimer = null;
		}, 300);
	}

	const appSettings = state.appSettings;
	if (appSettings !== _lastSavedAppSettings) {
		_lastSavedAppSettings = appSettings;
		saveAppSettings(appSettings);
	}

	const debug = state.debug;
	if (debug !== _lastSavedDebug) {
		_lastSavedDebug = debug;
		if (_debugTimer) clearTimeout(_debugTimer);
		_debugTimer = setTimeout(() => {
			saveDebugState(debug);
			_debugTimer = null;
		}, 300);
	}
});

// ─── Type helpers ─────────────────────────────────────────────────────────────

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
