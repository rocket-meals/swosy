import * as SQLite from 'expo-sqlite';
import { getUtf8ByteLength } from './ByteSizeHelper';

// Shared key-value storage backend for apps in this monorepo that persist simple
// JSON blobs per key (previously done ad hoc per-app via expo-file-system JSON files).
// This is the native/default implementation on purpose: expo-sqlite's web build pulls in
// a wasm module that Metro can't resolve without extra bundler/server config, so it must
// never be imported into the web bundle - see SqliteKeyValueStorage.web.ts, which Metro
// picks instead for web builds (same pattern as apps/frontend/app/redux/storage/sqliteStorage.ts).

export const DEFAULT_DB_NAME = 'app_storage.db';

export type SqliteStorageKeyUsage = { key: string; bytes: number };

const dbPromises = new Map<string, Promise<SQLite.SQLiteDatabase>>();

// Exported (not just used internally) so apps that need direct SQL access beyond the
// get/set/remove helpers below - e.g. rocket-meals' AsyncStorage-to-sqlite migration, which
// needs transactions - can share this same connection/table-creation boilerplate instead of
// importing expo-sqlite and duplicating it themselves.
export function getKvDatabase(dbName: string = DEFAULT_DB_NAME): Promise<SQLite.SQLiteDatabase> {
	const existing = dbPromises.get(dbName);
	if (existing) {
		return existing;
	}
	const dbPromise = SQLite.openDatabaseAsync(dbName).then(async (db: SQLite.SQLiteDatabase) => {
		await db.execAsync('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT)');
		return db;
	});
	dbPromises.set(dbName, dbPromise);
	return dbPromise;
}

export async function getStorageItem(key: string, dbName: string = DEFAULT_DB_NAME): Promise<string | null> {
	const db = await getKvDatabase(dbName);
	const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
	return row ? row.value : null;
}

export async function setStorageItem(key: string, value: string, dbName: string = DEFAULT_DB_NAME): Promise<void> {
	const db = await getKvDatabase(dbName);
	await db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, value);
}

export async function removeStorageItem(key: string, dbName: string = DEFAULT_DB_NAME): Promise<void> {
	const db = await getKvDatabase(dbName);
	await db.runAsync('DELETE FROM kv WHERE key = ?', key);
}

// Powers the debug "storage usage" settings list (see SettingsListSqliteStorage) - lists
// every key in the kv table with its approximate size. Skips internal sentinel keys wrapped
// in double underscores (e.g. rocket-meals' AsyncStorage-migration marker), matching what
// those apps' own debug screens already excluded before this moved here.
export async function getStorageUsage(
	dbName: string = DEFAULT_DB_NAME
): Promise<{ items: SqliteStorageKeyUsage[]; totalBytes: number }> {
	const db = await getKvDatabase(dbName);
	const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM kv');
	const items = rows
		.filter((row: { key: string; value: string }) => !(row.key.startsWith('__') && row.key.endsWith('__')))
		.map((row: { key: string; value: string }) => ({ key: row.key, bytes: getUtf8ByteLength(row.value ?? '') }))
		.sort((a: SqliteStorageKeyUsage, b: SqliteStorageKeyUsage) => b.bytes - a.bytes);
	const totalBytes = items.reduce((sum: number, item: SqliteStorageKeyUsage) => sum + item.bytes, 0);
	return { items, totalBytes };
}

export async function clearStorage(dbName: string = DEFAULT_DB_NAME): Promise<void> {
	const db = await getKvDatabase(dbName);
	await db.execAsync('DELETE FROM kv');
}
