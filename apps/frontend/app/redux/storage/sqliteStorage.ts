import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import type { Storage } from 'redux-persist';

// AsyncStorage enforces a hard ~2MB limit per item on Android, which this app has
// repeatedly hit (see the comments in redux/store/store.ts and redux/reducer/index.ts).
// expo-sqlite has no such per-value ceiling, so it replaces AsyncStorage as the
// redux-persist storage engine on native. Existing users still have their state under
// the old AsyncStorage keys ("persist:root", "persist:foodOffers") - getItem() below
// migrates each key over lazily and idempotently the first time it's read, instead of
// requiring a separate blocking migration step before the store is created.
//
// This is the native/default implementation on purpose: expo-sqlite's web build pulls in
// a wasm module that Metro can't resolve without extra bundler/server config, so it must
// never be imported into the web bundle - see sqliteStorage.web.ts, which Metro picks
// instead for web builds (same pattern as hooks/useColorScheme.web.ts).

const DB_NAME = 'redux_persist.db';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
	if (!dbPromise) {
		dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
			await db.execAsync('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT)');
			return db;
		});
	}
	return dbPromise;
}

export const sqliteStorage: Storage = {
	async getItem(key: string) {
		const db = await getDb();
		const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
		if (row) {
			return row.value;
		}

		// Not in sqlite yet - fall back to the old AsyncStorage location and migrate it over.
		const legacyValue = await AsyncStorage.getItem(key);
		if (legacyValue === null) {
			return null;
		}

		await db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, legacyValue);
		await AsyncStorage.removeItem(key);
		return legacyValue;
	},

	async setItem(key: string, value: string) {
		const db = await getDb();
		await db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, value);
	},

	async removeItem(key: string) {
		const db = await getDb();
		await db.runAsync('DELETE FROM kv WHERE key = ?', key);
	},
};
