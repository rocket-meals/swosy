// Both mocks below store their data in a plain object at *test-file* module scope, not
// inside the module registry that jest.resetModules() clears - this lets tests simulate
// "app relaunch" (a fresh sqliteStorage.ts module instance, i.e. a fresh in-memory
// dbPromise) against data that survives like it would on real disk, the same way
// AsyncStorage and the sqlite db file both survive a real app relaunch.
const sqliteRows: Record<string, string> = {};
const asyncStorageRows: Record<string, string> = {};

function applySql(sql: string, key?: string, value?: string) {
	if (sql.startsWith('INSERT OR IGNORE')) {
		if (key !== undefined && !(key in sqliteRows)) sqliteRows[key] = value as string;
	} else if (sql.startsWith('INSERT')) {
		if (key !== undefined) sqliteRows[key] = value as string;
	} else if (sql.startsWith('DELETE FROM kv WHERE')) {
		if (key !== undefined) delete sqliteRows[key];
	} else if (sql.startsWith('DELETE FROM kv')) {
		Object.keys(sqliteRows).forEach((k) => delete sqliteRows[k]);
	}
}

jest.mock('expo-sqlite', () => ({
	openDatabaseAsync: jest.fn(async () => ({
		execAsync: jest.fn(async (sql: string) => applySql(sql)),
		runAsync: jest.fn(async (sql: string, key?: string, value?: string) => applySql(sql, key, value)),
		getFirstAsync: jest.fn(async (sql: string, key: string) => (key in sqliteRows ? { value: sqliteRows[key] } : null)),
		getAllAsync: jest.fn(async () => Object.entries(sqliteRows).map(([key, value]) => ({ key, value }))),
		withExclusiveTransactionAsync: jest.fn(async (task: (txn: any) => Promise<void>) => {
			await task({ runAsync: jest.fn(async (sql: string, key?: string, value?: string) => applySql(sql, key, value)) });
		}),
	})),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(async (key: string) => (key in asyncStorageRows ? asyncStorageRows[key] : null)),
		setItem: jest.fn(async (key: string, value: string) => {
			asyncStorageRows[key] = value;
		}),
		removeItem: jest.fn(async (key: string) => {
			delete asyncStorageRows[key];
		}),
		getAllKeys: jest.fn(async () => Object.keys(asyncStorageRows)),
		multiGet: jest.fn(async (keys: string[]) => keys.map((key) => [key, key in asyncStorageRows ? asyncStorageRows[key] : null])),
		multiRemove: jest.fn(async (keys: string[]) => {
			keys.forEach((key) => delete asyncStorageRows[key]);
		}),
		clear: jest.fn(async () => {
			Object.keys(asyncStorageRows).forEach((key) => delete asyncStorageRows[key]);
		}),
	},
}));

describe('sqliteStorage', () => {
	beforeEach(() => {
		Object.keys(sqliteRows).forEach((key) => delete sqliteRows[key]);
		Object.keys(asyncStorageRows).forEach((key) => delete asyncStorageRows[key]);
		jest.resetModules();
	});

	it('returns null for a key that exists nowhere', async () => {
		const { sqliteStorage } = await import('./sqliteStorage');
		expect(await sqliteStorage.getItem('missing')).toBeNull();
	});

	it('bulk-migrates every legacy AsyncStorage key into sqlite, without deleting AsyncStorage', async () => {
		// AsyncStorage is deliberately kept as a safety net for now (see the comment on
		// copyAsyncStorageIntoSqlite) - it should still have every key after migration, not
		// just sqlite.
		asyncStorageRows['persist:root'] = '{"a":1}';
		asyncStorageRows['auth_data'] = '{"token":"xyz"}';
		asyncStorageRows['selected_customer_enum'] = 'test';

		const { sqliteKeyValueStorage } = await import('./sqliteStorage');

		expect(await sqliteKeyValueStorage.getItem('persist:root')).toBe('{"a":1}');
		expect(await sqliteKeyValueStorage.getItem('auth_data')).toBe('{"token":"xyz"}');
		expect(await sqliteKeyValueStorage.getItem('selected_customer_enum')).toBe('test');
		expect(asyncStorageRows['persist:root']).toBe('{"a":1}');
		expect(asyncStorageRows['auth_data']).toBe('{"token":"xyz"}');
		expect(asyncStorageRows['selected_customer_enum']).toBe('test');
	});

	it('never re-copies AsyncStorage once the one-time migration has run', async () => {
		asyncStorageRows['persist:root'] = '{"a":1}';
		const { sqliteKeyValueStorage: firstOpen } = await import('./sqliteStorage');
		await firstOpen.getItem('persist:root'); // forces the db (and migration) open

		// Something writes back into AsyncStorage after migration already completed - e.g.
		// leftover code that hasn't been updated yet. A later app launch (fresh module
		// instance, mirroring a fresh db connection to the same on-disk db) must not pick
		// this up: the migration is guarded by a one-time sentinel row, not a per-key check.
		asyncStorageRows['persist:root'] = '{"a":"stale-should-be-ignored"}';

		jest.resetModules();
		const { sqliteKeyValueStorage: secondOpen } = await import('./sqliteStorage');
		expect(await secondOpen.getItem('persist:root')).toBe('{"a":1}');
	});

	it('setItem/removeItem/multiRemove/clear operate directly on sqlite', async () => {
		const { sqliteKeyValueStorage } = await import('./sqliteStorage');

		await sqliteKeyValueStorage.setItem('foo', 'bar');
		expect(await sqliteKeyValueStorage.getItem('foo')).toBe('bar');

		await sqliteKeyValueStorage.removeItem('foo');
		expect(await sqliteKeyValueStorage.getItem('foo')).toBeNull();

		await sqliteKeyValueStorage.setItem('a', '1');
		await sqliteKeyValueStorage.setItem('b', '2');
		await sqliteKeyValueStorage.multiRemove(['a', 'b']);
		expect(await sqliteKeyValueStorage.getItem('a')).toBeNull();
		expect(await sqliteKeyValueStorage.getItem('b')).toBeNull();

		await sqliteKeyValueStorage.setItem('c', '3');
		await sqliteKeyValueStorage.clear();
		expect(await sqliteKeyValueStorage.getItem('c')).toBeNull();
	});

	it('the redux-persist Storage adapter (sqliteStorage) reads migrated data too', async () => {
		asyncStorageRows['persist:root'] = '{"a":1}';
		const { sqliteStorage } = await import('./sqliteStorage');
		expect(await sqliteStorage.getItem('persist:root')).toBe('{"a":1}');
	});

	it('migration overwrites a pre-existing sqlite row with AsyncStorage data, not the other way round', async () => {
		// Regression test: a stray/poisoned sqlite row (e.g. left over from a since-fixed
		// race condition) must not block real data still sitting in AsyncStorage from being
		// migrated - INSERT OR IGNORE used to do exactly that and permanently destroy the
		// real value (AsyncStorage was cleared regardless of whether the insert landed).
		sqliteRows['persist:root'] = '{"a":"poisoned"}';
		asyncStorageRows['persist:root'] = '{"a":"real"}';

		const { sqliteKeyValueStorage } = await import('./sqliteStorage');
		expect(await sqliteKeyValueStorage.getItem('persist:root')).toBe('{"a":"real"}');
	});

	it('migrateAsyncStorageToSqlite() can be re-run manually after the automatic migration already completed', async () => {
		const { sqliteKeyValueStorage, migrateAsyncStorageToSqlite } = await import('./sqliteStorage');
		await sqliteKeyValueStorage.getItem('anything'); // forces the automatic (empty) migration to run and set its sentinel

		// Something left a key in AsyncStorage after the automatic migration already ran
		// (e.g. code that hasn't been updated to use sqliteKeyValueStorage yet).
		asyncStorageRows['leftover_key'] = '"still here"';

		const result = await migrateAsyncStorageToSqlite();
		expect(result.migratedKeys).toEqual(['leftover_key']);
		expect(await sqliteKeyValueStorage.getItem('leftover_key')).toBe('"still here"');
		// AsyncStorage is kept as a safety net for now - re-running the copy again should
		// still report the same key, not an empty list.
		const secondResult = await migrateAsyncStorageToSqlite();
		expect(secondResult.migratedKeys).toEqual(['leftover_key']);
	});
});
