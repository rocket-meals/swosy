import * as redux from 'redux';
import { legacy_createStore as createStore } from 'redux';
import * as thunk from 'redux-thunk';
import promise from 'redux-promise';
import { createMigrate, createTransform, persistReducer, persistStore } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sqliteStorage } from '@/redux/storage/sqliteStorage';
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

// Strip wiki content (list + translations, incl. markdown body) before the "settings"
// slice is written to AsyncStorage. Wikis are refetched title-only on every app start
// anyway (see (wikis)/_layout.tsx, CustomDrawerContent), so nothing is lost - this just
// keeps the heaviest field out of the persisted blob.
const settingsTransform = createTransform(
	(inboundState: any) => ({ ...inboundState, wikis: [], wikisPages: [] }),
	(outboundState: any) => outboundState,
	{ whitelist: ['settings'] }
);

const persistConfig = {
	key: 'root',
	version: 1, // 🔁 Bump this when you make breaking changes
	storage: sqliteStorage,
	migrate: createMigrate(migrations, { debug: false }),
	// News is refetched whenever its screen is opened (see app/(app)/news/index.tsx) and
	// FoodOffers persists under its own storage item (see redux/reducer/index.ts) -
	// neither belongs in this combined "persist:root" blob. Keeping the root item small
	// mattered for Android's ~2MB per-AsyncStorage-item limit; sqliteStorage removes that
	// ceiling, but the split still keeps unrelated data out of the same blob.
	blacklist: ['news', 'foodOffers'],
	transforms: [settingsTransform],
};

const rootReducer = (state: any, action: any) => {
	if (action.type === 'RESET_STORE') {
		const { settings } = state;
		AsyncStorage.clear(); // optional: force clear AsyncStorage too
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
