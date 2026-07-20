import AsyncStorage from '@react-native-async-storage/async-storage';
import { getKvDatabase } from 'repo-depkit-common-ui';
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
// instead for web builds (same pattern as hooks/useColorScheme.web.ts). The actual
// expo-sqlite import + db-open/table-creation boilerplate lives in repo-depkit-common-ui's
// SqliteKeyValueStorage (getKvDatabase) so it isn't duplicated per app; this module only
// owns the AsyncStorage-migration logic below, which is specific to rocket-meals.

const DB_NAME = 'redux_persist.db';
const MIGRATION_VERIFIED_KEY = '__async_storage_migration_verified__';
type KvDatabase = Awaited<ReturnType<typeof getKvDatabase>>;
let migratedDbPromise: Promise<KvDatabase> | null = null;

// Copies every currently-existing AsyncStorage key into the kv table. Deliberately does
// NOT clear AsyncStorage afterwards (yet) - keeping the old copy around is a safety net
// while this migration is still being validated in production, so a bug here can't cause
// permanent data loss the way INSERT OR IGNORE previously did (see below). Once the sqlite
// migration is confirmed solid for a while, re-add an AsyncStorage.multiRemove(legacyKeys)
// call here (and update the sqliteKeyValueStorage doc comment) to actually retire it.
//
// Uses INSERT OR REPLACE, not INSERT OR IGNORE: an earlier version of this used IGNORE on
// the (wrong) assumption that an existing sqlite row was always a newer, more authoritative
// write than whatever's left in AsyncStorage. That assumption broke real user data - a
// build with a since-fixed race condition (see afterRehydration.ts) could write a blank
// "persist:root" row into sqlite *without* ever clearing the real value out of AsyncStorage.
// For those users IGNORE meant this migration saw "a row already exists", kept the blank
// sqlite row, and then deleted the last real copy from AsyncStorage anyway - permanent data
// loss. AsyncStorage is being retired here, so its copy should always win when both exist.
async function copyAsyncStorageIntoSqlite(db: KvDatabase): Promise<string[]> {
	const legacyKeys = await AsyncStorage.getAllKeys();
	if (legacyKeys.length === 0) {
		return [];
	}

	const legacyEntries = await AsyncStorage.multiGet(legacyKeys);
	const migratedKeys: string[] = [];
	await db.withExclusiveTransactionAsync(async (txn: any) => {
		for (const [key, value] of legacyEntries) {
			if (value !== null) {
				await txn.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, value);
				migratedKeys.push(key);
			}
		}
	});
	return migratedKeys;
}

// Re-reads every AsyncStorage key and compares it against what's now in the kv table, i.e.
// confirms copyAsyncStorageIntoSqlite() actually landed correctly instead of just assuming
// it did because no exception was thrown. This is what INSERT OR IGNORE was missing: it
// silently "succeeded" while keeping a stale/blank sqlite row, and nothing ever caught that.
async function isMigrationVerified(db: KvDatabase): Promise<boolean> {
	const legacyKeys = await AsyncStorage.getAllKeys();
	if (legacyKeys.length === 0) {
		return true;
	}

	const legacyEntries = await AsyncStorage.multiGet(legacyKeys);
	for (const [key, value] of legacyEntries) {
		if (value === null) {
			continue;
		}
		const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
		if (!row || row.value !== value) {
			return false;
		}
	}
	return true;
}

// Copies AsyncStorage into sqlite and, only if isMigrationVerified() confirms every key
// landed correctly, marks it done via a sentinel row so it isn't repeated on every future
// boot. That "only if verified" is the key difference from an earlier version of this: it
// unconditionally wrote the sentinel right after copying, without checking anything actually
// worked - which both hid a real bug (INSERT OR IGNORE silently keeping stale data) and,
// once that was fixed, caused a second bug the opposite way: with no gate at all, the copy
// re-ran unconditionally on *every* boot, and since it always favors AsyncStorage's frozen,
// no-longer-updated snapshot, it kept overwriting genuinely newer sqlite data (anything
// written via setItem() after migration) with the stale original values on every restart.
// Verifying before gating fixes both: a bad copy is retried next boot (self-heals), a good
// copy is trusted and left alone (so the app can actually live in sqlite afterwards).
async function copyAndVerify(db: KvDatabase): Promise<{ migratedKeys: string[]; verified: boolean }> {
	const migratedKeys = await copyAsyncStorageIntoSqlite(db);
	const verified = await isMigrationVerified(db);
	if (verified) {
		await db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', MIGRATION_VERIFIED_KEY, 'true');
	}
	return { migratedKeys, verified };
}

// Runs as part of opening the db (see getSqliteDb() below), before migratedDbPromise
// resolves - so every getItem()/setItem()/removeItem() call, for any key, from any of this
// app's storage helpers, waits on this same promise first. That's what makes it race-free: a
// setItem() for one key can never land while an unrelated key is still mid-migration and
// overwrite the table with something derived from a stale, pre-migration snapshot (see the
// "dispatch before rehydration" bug this replaced, where per-key lazy migration let a fast
// write win a race against a slower one and permanently strand the real data in AsyncStorage).
async function ensureAsyncStorageMigrated(db: KvDatabase): Promise<void> {
	const alreadyVerified = await db.getFirstAsync<{ value: string }>(
		'SELECT value FROM kv WHERE key = ?',
		MIGRATION_VERIFIED_KEY
	);
	if (alreadyVerified) {
		return;
	}

	await copyAndVerify(db);
}

// Exported so the debug storage-usage settings screen (SettingsListSqliteStorage, dbName
// "redux_persist.db") can query the same kv table without opening a second connection.
export function getSqliteDb(): Promise<KvDatabase> {
	migratedDbPromise ??= getKvDatabase(DB_NAME).then(async (db) => {
		await ensureAsyncStorageMigrated(db);
		return db;
	});
	return migratedDbPromise;
}

// Manual re-run of the migration copy, exposed for the settings debug screen's "Daten
// migrieren" button - lets a user force an immediate resync (and re-verify) without
// restarting the app, bypassing the "already verified" gate above.
export async function migrateAsyncStorageToSqlite(): Promise<{ migratedKeys: string[] }> {
	const db = await getSqliteDb();
	const { migratedKeys } = await copyAndVerify(db);
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
		await db.withExclusiveTransactionAsync(async (txn: any) => {
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
