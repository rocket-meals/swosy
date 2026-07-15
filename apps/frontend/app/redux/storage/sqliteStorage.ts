import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import type { Storage } from 'redux-persist';

// AsyncStorage enforces a hard ~2MB limit per item on Android, which this app has
// repeatedly hit (see the comments in redux/store/store.ts and redux/reducer/index.ts).
// expo-sqlite has no such per-value ceiling, so this "kv" table is meant to become the
// single storage engine for the whole app - not just redux-persist's state, but every
// AsyncStorage-backed key (auth token, server selection, per-feature caches, ...) via
// sqliteKeyValueStorage below. Once every user has upgraded past this, AsyncStorage - and
// the migration below - can be deleted outright.
//
// This is the native/default implementation on purpose: expo-sqlite's web build pulls in
// a wasm module that Metro can't resolve without extra bundler/server config, so it must
// never be imported into the web bundle - see sqliteStorage.web.ts, which Metro picks
// instead for web builds (same pattern as hooks/useColorScheme.web.ts).

const DB_NAME = 'redux_persist.db';
const MIGRATION_DONE_KEY = '__async_storage_migration_done__';
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Copies every currently-existing AsyncStorage key into the kv table and then clears
// AsyncStorage. Crash-safe: AsyncStorage is only cleared after the sqlite write is
// confirmed, so a crash mid-copy just means the same keys get copied again next call.
//
// Uses INSERT OR REPLACE, not INSERT OR IGNORE: an earlier version of this used IGNORE on
// the (wrong) assumption that an existing sqlite row was always a newer, more authoritative
// write than whatever's left in AsyncStorage. That assumption broke real user data - a
// build with a since-fixed race condition (see afterRehydration.ts) could write a blank
// "persist:root" row into sqlite *without* ever clearing the real value out of AsyncStorage.
// For those users IGNORE meant this migration saw "a row already exists", kept the blank
// sqlite row, and then deleted the last real copy from AsyncStorage anyway - permanent data
// loss. AsyncStorage is being retired here, so its copy should always win when both exist.
async function copyAsyncStorageIntoSqlite(db: SQLite.SQLiteDatabase): Promise<string[]> {
	const legacyKeys = await AsyncStorage.getAllKeys();
	if (legacyKeys.length === 0) {
		return [];
	}

	const legacyEntries = await AsyncStorage.multiGet(legacyKeys);
	const migratedKeys: string[] = [];
	await db.withExclusiveTransactionAsync(async (txn) => {
		for (const [key, value] of legacyEntries) {
			if (value !== null) {
				await txn.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, value);
				migratedKeys.push(key);
			}
		}
	});
	await AsyncStorage.multiRemove(legacyKeys);
	return migratedKeys;
}

// Runs the copy above exactly once per db (guarded by a sentinel row), as part of opening
// the db (see getSqliteDb() below) - before dbPromise resolves, so every getItem()/
// setItem()/removeItem() call, for any key, from any of this app's storage helpers, waits
// on this same promise first. That's what makes it race-free: a setItem() for one key can
// never land while an unrelated key is still mid-migration and overwrite the table with
// something derived from a stale, pre-migration snapshot (see the "dispatch before
// rehydration" bug this replaced, where per-key lazy migration let a fast write win a race
// against a slower one and permanently strand the real data in AsyncStorage).
async function ensureAsyncStorageMigrated(db: SQLite.SQLiteDatabase): Promise<void> {
	const alreadyMigrated = await db.getFirstAsync<{ value: string }>(
		'SELECT value FROM kv WHERE key = ?',
		MIGRATION_DONE_KEY
	);
	if (alreadyMigrated) {
		return;
	}

	await copyAsyncStorageIntoSqlite(db);
	await db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', MIGRATION_DONE_KEY, 'true');
}

// Exported so SqliteStorageUsageHelper.ts can query the same kv table for the debug
// storage-usage screen without opening a second connection to the db.
export function getSqliteDb(): Promise<SQLite.SQLiteDatabase> {
	if (!dbPromise) {
		dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
			await db.execAsync('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT)');
			await ensureAsyncStorageMigrated(db);
			return db;
		});
	}
	return dbPromise;
}

// Manual, repeatable re-run of the migration copy, exposed for the settings debug screen's
// "Daten migrieren" button. The automatic migration above only ever runs once per db (it's
// meant to be invisible), so it can't be retried from the UI if something looks wrong; this
// bypasses the sentinel and re-copies whatever's currently left in AsyncStorage, so a user
// (or support) can force a resync without reinstalling the app.
export async function migrateAsyncStorageToSqlite(): Promise<{ migratedKeys: string[] }> {
	const db = await getSqliteDb();
	const migratedKeys = await copyAsyncStorageIntoSqlite(db);
	return { migratedKeys };
}

// General-purpose AsyncStorage-shaped key/value API backed by the same kv table and the
// same migration as sqliteStorage below. Use this (via constants/AsyncStorageHelper.ts, or
// directly for raw string values) instead of importing AsyncStorage anywhere in the app -
// the goal is for AsyncStorage to only ever be read from during the migration above, never
// written to again.
export const sqliteKeyValueStorage = {
	async getItem(key: string): Promise<string | null> {
		const db = await getSqliteDb();
		const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
		return row ? row.value : null;
	},

	async setItem(key: string, value: string): Promise<void> {
		const db = await getSqliteDb();
		await db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, value);
	},

	async removeItem(key: string): Promise<void> {
		const db = await getSqliteDb();
		await db.runAsync('DELETE FROM kv WHERE key = ?', key);
	},

	async multiRemove(keys: string[]): Promise<void> {
		if (keys.length === 0) return;
		const db = await getSqliteDb();
		await db.withExclusiveTransactionAsync(async (txn) => {
			for (const key of keys) {
				await txn.runAsync('DELETE FROM kv WHERE key = ?', key);
			}
		});
	},

	async clear(): Promise<void> {
		const db = await getSqliteDb();
		await db.execAsync('DELETE FROM kv');
	},
};

export const sqliteStorage: Storage = sqliteKeyValueStorage;
