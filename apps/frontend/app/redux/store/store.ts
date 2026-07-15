import * as redux from 'redux';
import { legacy_createStore as createStore } from 'redux';
import * as thunk from 'redux-thunk';
import promise from 'redux-promise';
import { createMigrate, persistReducer, persistStore } from 'redux-persist';
import { sqliteStorage, sqliteKeyValueStorage } from '@/redux/storage/sqliteStorage';
import { reducer } from '@/redux/reducer';

const migrations = {
	// define migrations
	1: () => {
		// For now we return undefined to clear the store on first migration
		return undefined;
	},
	2: () => {
		// Clear persisted state and trigger logout flow if needed
		if (typeof window !== 'undefined') {
			localStorage.clear(); // Or AsyncStorage.clear()
			window.location.reload(); // Force app reload
		}
		return undefined;
	},
};

const persistConfig = {
	key: 'root',
	version: 1, // 🔁 Bump this when you make breaking changes
	storage: sqliteStorage,
	migrate: createMigrate(migrations, { debug: false }),
	// FoodOffers persists under its own storage item (see redux/reducer/index.ts) instead
	// of this combined "persist:root" blob. News and the settings slice's wikis/wikisPages
	// used to be excluded/stripped here too to stay under Android's ~2MB per-AsyncStorage-
	// item limit; sqliteStorage has no such ceiling, so both are fully persisted again.
	blacklist: ['foodOffers'],
};

const rootReducer = (state: any, action: any) => {
	if (action.type === 'RESET_STORE') {
		const { settings } = state;
		sqliteKeyValueStorage.clear(); // optional: force clear all storage too
		state = { settings };
	}
	return reducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// You can enable logger in dev only

// const middleware = redux.applyMiddleware(promise, thunk.thunk, logger);

const middleware = redux.applyMiddleware(promise, thunk.thunk);

export const configureStore = createStore(persistedReducer, middleware);

export const persistor = persistStore(configureStore);
