import * as SQLite from 'expo-sqlite';

// Shared key-value storage backend for apps in this monorepo that persist simple
// JSON blobs per key (previously done ad hoc per-app via expo-file-system JSON files).
// This is the native/default implementation on purpose: expo-sqlite's web build pulls in
// a wasm module that Metro can't resolve without extra bundler/server config, so it must
// never be imported into the web bundle - see SqliteKeyValueStorage.web.ts, which Metro
// picks instead for web builds (same pattern as apps/frontend/app/redux/storage/sqliteStorage.ts).

export const DEFAULT_DB_NAME = 'app_storage.db';

const dbPromises = new Map<string, Promise<SQLite.SQLiteDatabase>>();

function getDb(dbName: string): Promise<SQLite.SQLiteDatabase> {
	let dbPromise = dbPromises.get(dbName);
	if (!dbPromise) {
		dbPromise = SQLite.openDatabaseAsync(dbName).then(async (db) => {
			await db.execAsync('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT)');
			return db;
		});
		dbPromises.set(dbName, dbPromise);
	}
	return dbPromise;
}

export async function getStorageItem(key: string, dbName: string = DEFAULT_DB_NAME): Promise<string | null> {
	const db = await getDb(dbName);
	const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
	return row ? row.value : null;
}

export async function setStorageItem(key: string, value: string, dbName: string = DEFAULT_DB_NAME): Promise<void> {
	const db = await getDb(dbName);
	await db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, value);
}

export async function removeStorageItem(key: string, dbName: string = DEFAULT_DB_NAME): Promise<void> {
	const db = await getDb(dbName);
	await db.runAsync('DELETE FROM kv WHERE key = ?', key);
}
